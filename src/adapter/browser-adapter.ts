import { Browser, BrowserContext, Page, CDPSession, chromium } from 'playwright';
import { EventEmitter } from 'events';
import { join } from 'path';
import { mkdir, readdir, stat, readFile } from 'fs/promises';
import {
  PageSnapshot,
  ScreenshotResult,
  RecordingResult,
  NavigateOptions,
  ClickOptions,
  FillOptions,
  UploadOptions,
  DownloadOptions,
  InspectOptions,
  BrowserConnectOptions,
  BrowserStatus,
  AccessibilityNode,
  EvidenceManifest,
  RunContext
} from './types.js';
import { configManager } from '../config/index.js';

interface ManagedBrowserState {
  browser: Browser;
  context: BrowserContext;
  defaultPage: Page;
  cdpSession?: CDPSession;
  recordingPage?: Page;
  runContext?: RunContext;
  rollingChunks: Buffer[];
  consoleMessages: Array<{ type: string; text: string; timestamp: number }>;
  networkRequests: Array<{ method: string; url: string; resourceType: string; timestamp: number }>;
  locatorRefs: Map<string, string>;
  nextLocatorRef: number;
  dialogAction?: { action: 'accept' | 'dismiss'; promptText?: string };
  tracing: boolean;
}

export class BrowserAdapter extends EventEmitter {
  private state: ManagedBrowserState | null = null;
  private extensionPort: number = 9222;
  private extensionConnected: boolean = false;
  private eventIdCounter: number = 0;
  private recordingStartedAt?: number;

  async connect(options: BrowserConnectOptions): Promise<BrowserStatus> {
    switch (options.mode) {
      case 'auto':
        return this.connectAutomatically(options);
      case 'managed':
        return this.connectManaged(options);
      case 'extension':
        return this.connectExtension(options);
      case 'cdp':
        return this.connectCDP(options);
      default:
        throw new Error(`Unknown browser mode: ${options.mode}`);
    }
  }

  private async connectAutomatically(options: BrowserConnectOptions): Promise<BrowserStatus> {
    const { getDebugPort } = await import('../cli/profiles.js');
    const runningPort = options.cdpPort || await getDebugPort();
    if (runningPort) {
      try {
        return await this.connectExtension({ ...options, mode: 'extension', extensionPort: runningPort });
      } catch {
        // Existing Chrome was detected but was not attachable; fall back to clean Chromium.
      }
    }
    return this.connectManaged({ ...options, mode: 'managed', headless: options.headless ?? false });
  }

  private async connectManaged(options: BrowserConnectOptions): Promise<BrowserStatus> {
    const launchOptions: any = {
      headless: options.headless ?? false,
      args: options.args || [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    };

    // Handle profile: named profiles get isolated user-data-dirs
    if (options.profile && options.profile !== 'default') {
      // Check if this is a Chrome profile (Default, Profile 1, etc.)
      const isChromeProfile = options.profile === 'Default' || /^Profile \d+$/.test(options.profile);

      if (isChromeProfile) {
        // Use Chrome's actual user data directory for existing profiles
        const chromeUserData = join(
          process.env['LOCALAPPDATA'] || '',
          'Google', 'Chrome', 'User Data'
        );
        launchOptions.args.push(`--user-data-dir=${chromeUserData}`);
        launchOptions.args.push(`--profile-directory=${options.profile}`);
      } else {
        // Custom named profile gets isolated directory
        const userDataDir = join(process.cwd(), 'browser-profiles', options.profile);
        await mkdir(userDataDir, { recursive: true });
        launchOptions.args.push(`--user-data-dir=${userDataDir}`);
      }
    }

    const browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: { dir: configManager.get('browser.approvedDirectories.recordings') as string }
    });

    const defaultPage = await context.newPage();
    await this.setupPageListeners(defaultPage);

    this.state = {
      browser,
      context,
      defaultPage,
      rollingChunks: [],
      consoleMessages: [],
      networkRequests: [],
      locatorRefs: new Map(),
      nextLocatorRef: 1,
      tracing: false
    };

    this.setupBrowserListeners(browser);

    return this.getStatus();
  }

  private async connectExtension(options: BrowserConnectOptions): Promise<BrowserStatus> {
    const port = options.extensionPort || this.extensionPort;
    const cdpEndpoint = `http://localhost:${port}`;

    try {
      const browser = await chromium.connectOverCDP(cdpEndpoint);
      const contexts = browser.contexts();
      const context = contexts[0] || await browser.newContext();

      const pages = context.pages();
      const defaultPage = pages[0] || await context.newPage();
      await this.setupPageListeners(defaultPage);

      this.state = {
        browser,
        context,
        defaultPage,
        rollingChunks: [],
        consoleMessages: [],
        networkRequests: [],
        locatorRefs: new Map(),
        nextLocatorRef: 1,
        tracing: false
      };

      this.extensionConnected = true;
      this.setupBrowserListeners(browser);

      return this.getStatus();
    } catch {
      throw new Error(`Failed to connect to Chrome extension on port ${port}. Ensure the extension is installed and "Allow access to file URLs" is enabled. Run with --extension-port if using a different port.`);
    }
  }

  private async connectCDP(options: BrowserConnectOptions): Promise<BrowserStatus> {
    const endpoint = options.cdpEndpoint || `http://localhost:${options.cdpPort || 9222}`;

    if (configManager.get('safety.blockUnrestrictedCdp')) {
      console.warn('Warning: Unrestricted CDP connections are blocked by safety policy. Use managed or extension mode instead.');
    }

    const browser = await chromium.connectOverCDP(endpoint);
    const contexts = browser.contexts();
    const context = contexts[0] || await browser.newContext();

    const pages = context.pages();
    const defaultPage = pages[0] || await context.newPage();
    await this.setupPageListeners(defaultPage);

    this.state = {
      browser,
      context,
      defaultPage,
      rollingChunks: [],
      consoleMessages: [],
      networkRequests: [],
      locatorRefs: new Map(),
      nextLocatorRef: 1,
      tracing: false
    };

    this.setupBrowserListeners(browser);

    return this.getStatus();
  }

  private setupBrowserListeners(browser: Browser): void {
    browser.on('disconnected', () => {
      this.emit('disconnected');
      this.state = null;
    });
  }

  private async setupPageListeners(page: Page): Promise<void> {
    page.on('console', msg => {
      const entry = { type: msg.type(), text: msg.text(), timestamp: Date.now() };
      this.state?.consoleMessages.push(entry);
      if (this.state && this.state.consoleMessages.length > 500) this.state.consoleMessages.shift();
      if (msg.type() === 'error') this.emit('consoleError', msg.text());
    });

    page.on('pageerror', error => {
      const entry = { type: 'pageerror', text: error.message, timestamp: Date.now() };
      this.state?.consoleMessages.push(entry);
      this.emit('pageError', error.message);
    });

    page.on('request', request => {
      const entry = { method: request.method(), url: request.url(), resourceType: request.resourceType(), timestamp: Date.now() };
      this.state?.networkRequests.push(entry);
      if (this.state && this.state.networkRequests.length > 1000) this.state.networkRequests.shift();
    });

    page.on('dialog', async dialog => {
      const configured = this.state?.dialogAction;
      this.emit('dialog', { type: dialog.type(), message: dialog.message(), defaultValue: dialog.defaultValue() });
      if (configured?.action === 'accept') await dialog.accept(configured.promptText);
      else await dialog.dismiss();
    });

    page.on('load', () => {
      this.emit('navigation', page.url());
    });
  }

  async disconnect(): Promise<void> {
    if (this.state) {
      if (this.state.recordingPage) {
        await this.stopRecording();
      }
      await this.state.browser.close();
      this.state = null;
      this.extensionConnected = false;
      this.emit('disconnected');
    }
  }

  async getStatus(): Promise<BrowserStatus> {
    if (!this.state) {
      return {
        connected: false,
        mode: 'disconnected',
        approvedDirectories: Object.values(configManager.getConfig().browser.approvedDirectories)
      };
    }

    const { browser, defaultPage } = this.state;
    const browserType = browser.browserType().name();

    const title = await defaultPage.title().catch(() => '');

    return {
      connected: true,
      mode: this.extensionConnected ? 'extension' : (this.state.browser.isConnected() ? 'managed' : 'cdp'),
      browserInfo: {
        browserType: browserType as 'chromium' | 'firefox' | 'webkit',
        version: browser.version(),
        executablePath: browser.browserType().executablePath(),
        isManaged: !this.extensionConnected
      },
      activeTab: defaultPage ? {
        url: defaultPage.url(),
        title
      } : undefined,
      approvedDirectories: Object.values(configManager.getConfig().browser.approvedDirectories)
    };
  }

  async listPages(): Promise<Array<{ index: number; url: string; title: string }>> {
    if (!this.state) throw new Error('Browser not connected. Call connect() first.');
    const pages = this.state.context.pages();
    return Promise.all(pages.map(async (page, index) => ({ index, url: page.url(), title: await page.title().catch(() => '') })));
  }

  async newPage(url?: string): Promise<{ index: number; url: string; title: string }> {
    if (!this.state) throw new Error('Browser not connected. Call connect() first.');
    const page = await this.state.context.newPage();
    await this.setupPageListeners(page);
    this.state.defaultPage = page;
    if (url) await page.goto(url, { waitUntil: 'domcontentloaded' });
    const pages = this.state.context.pages();
    return { index: pages.indexOf(page), url: page.url(), title: await page.title().catch(() => '') };
  }

  async switchPage(index: number): Promise<{ index: number; url: string; title: string }> {
    if (!this.state) throw new Error('Browser not connected. Call connect() first.');
    const page = this.state.context.pages()[index];
    if (!page) throw new Error(`Page index ${index} not found.`);
    this.state.defaultPage = page;
    return { index, url: page.url(), title: await page.title().catch(() => '') };
  }

  async closePage(index?: number): Promise<void> {
    if (!this.state) throw new Error('Browser not connected. Call connect() first.');
    const pages = this.state.context.pages();
    const page = pages[index ?? pages.indexOf(this.state.defaultPage)];
    if (!page) throw new Error(`Page index ${index ?? -1} not found.`);
    await page.close();
    const remaining = this.state.context.pages();
    if (remaining.length > 0) this.state.defaultPage = remaining[Math.min(index ?? 0, remaining.length - 1)]!;
  }

  async goBack(): Promise<PageSnapshot> {
    await this.getActivePage().goBack({ waitUntil: 'domcontentloaded' });
    return this.inspectPage({ includeA11y: true, includeDOM: true });
  }

  async goForward(): Promise<PageSnapshot> {
    await this.getActivePage().goForward({ waitUntil: 'domcontentloaded' });
    return this.inspectPage({ includeA11y: true, includeDOM: true });
  }

  async reload(): Promise<PageSnapshot> {
    await this.getActivePage().reload({ waitUntil: 'domcontentloaded' });
    return this.inspectPage({ includeA11y: true, includeDOM: true });
  }

  async getText(selector: string): Promise<string> {
    return (await this.getActivePage().locator(selector).innerText()).trim();
  }

  async getAttribute(selector: string, name: string): Promise<string | null> {
    return this.getActivePage().locator(selector).getAttribute(name);
  }

  async isVisible(selector: string): Promise<boolean> {
    return this.getActivePage().locator(selector).isVisible();
  }

  private resolveSelector(selectorOrRef: string): string {
    if (selectorOrRef.startsWith('ref:')) {
      const selector = this.state?.locatorRefs.get(selectorOrRef);
      if (!selector) throw new Error(`Unknown locator reference: ${selectorOrRef}`);
      return selector;
    }
    return selectorOrRef;
  }

  async createRoleLocatorRef(options: { role: string; name?: string; exact?: boolean }): Promise<{ ref: string; role: string; name?: string; count: number }> {
    if (!this.state) throw new Error('Browser not connected. Call connect() first.');
    const locator = this.getActivePage().getByRole(options.role as any, { name: options.name, exact: options.exact });
    const count = await locator.count();
    if (count === 0) throw new Error(`No accessible element matched role ${options.role}${options.name ? ` named ${options.name}` : ''}. Inspect the page and try a visible role/name.`);
    const ref = `ref:${this.state.nextLocatorRef++}`;
    const tagByRole: Record<string, string> = { button: 'button', link: 'a', textbox: 'input,textarea', checkbox: 'input[type="checkbox"]', radio: 'input[type="radio"]', heading: 'h1,h2,h3,h4,h5,h6' };
    const tag = tagByRole[options.role] || `[role="${options.role}"]`;
    const selector = options.name ? `${tag}:has-text("${options.name.replace(/\\"/g, '\\\\"')}")` : tag;
    this.state.locatorRefs.set(ref, selector);
    return { ref, role: options.role, name: options.name, count };
  }

  async createLocatorRef(selector: string): Promise<{ ref: string; selector: string; count: number }> {
    if (!this.state) throw new Error('Browser not connected. Call connect() first.');
    const resolved = this.resolveSelector(selector);
    const count = await this.getActivePage().locator(resolved).count();
    if (count === 0) throw new Error(`No element matched selector: ${resolved}`);
    const ref = `ref:${this.state.nextLocatorRef++}`;
    this.state.locatorRefs.set(ref, resolved);
    return { ref, selector: resolved, count };
  }

  async assertLocator(options: { selector: string; assertion: 'visible' | 'hidden' | 'enabled' | 'disabled' | 'checked' | 'unchecked' | 'text' | 'count'; expected?: string | number }): Promise<{ passed: true; selector: string }> {
    const selector = this.resolveSelector(options.selector);
    const locator = this.getActivePage().locator(selector);
    let passed = false;
    switch (options.assertion) {
      case 'visible': passed = await locator.isVisible(); break;
      case 'hidden': passed = !(await locator.isVisible()); break;
      case 'enabled': passed = await locator.isEnabled(); break;
      case 'disabled': passed = !(await locator.isEnabled()); break;
      case 'checked': passed = await locator.isChecked(); break;
      case 'unchecked': passed = !(await locator.isChecked()); break;
      case 'text': passed = (await locator.innerText()).includes(String(options.expected ?? '')); break;
      case 'count': passed = (await locator.count()) === Number(options.expected); break;
    }
    if (!passed) throw new Error(`Assertion failed: ${options.assertion} for ${selector}`);
    return { passed: true, selector };
  }

  async listFrames(): Promise<Array<{ index: number; name: string; url: string }>> {
    return this.getActivePage().frames().map((frame, index) => ({ index, name: frame.name(), url: frame.url() }));
  }

  async inspectFrame(index: number): Promise<{ index: number; name: string; url: string; title: string }> {
    const frame = this.getActivePage().frames()[index];
    if (!frame) throw new Error(`Frame index ${index} not found.`);
    return { index, name: frame.name(), url: frame.url(), title: await frame.title().catch(() => '') };
  }

  async setDialogAction(action: 'accept' | 'dismiss', promptText?: string): Promise<void> {
    if (!this.state) throw new Error('Browser not connected. Call connect() first.');
    this.state.dialogAction = { action, promptText };
  }

  async getCookies(urls?: string[]): Promise<unknown[]> {
    if (!this.state) throw new Error('Browser not connected. Call connect() first.');
    return this.state.context.cookies(urls);
  }

  async clearCookies(): Promise<void> {
    if (!this.state) throw new Error('Browser not connected. Call connect() first.');
    await this.state.context.clearCookies();
  }

  async restoreStorageState(filepath: string, confirm = false): Promise<{ cookies: number }> {
    if (!this.state) throw new Error('Browser not connected. Call connect() first.');
    if (!confirm) throw new Error('Restoring storage state changes the active browser session. Ask for confirmation first.');
    const raw = JSON.parse(await readFile(filepath, 'utf-8')) as { cookies?: Array<Parameters<BrowserContext['addCookies']>[0][number]> };
    const cookies = raw.cookies || [];
    await this.state.context.addCookies(cookies);
    return { cookies: cookies.length };
  }

  async saveStorageState(filename = `storage-${Date.now()}.json`): Promise<string> {
    if (!this.state) throw new Error('Browser not connected. Call connect() first.');
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filepath = join(configManager.get('browser.approvedDirectories.downloads') as string, safeFilename);
    await this.state.context.storageState({ path: filepath });
    return filepath;
  }

  async getConsoleMessages(): Promise<Array<{ type: string; text: string; timestamp: number }>> {
    return [...(this.state?.consoleMessages || [])];
  }

  async getNetworkRequests(): Promise<Array<{ method: string; url: string; resourceType: string; timestamp: number }>> {
    return [...(this.state?.networkRequests || [])];
  }

  async routeMock(options: { url: string; status?: number; contentType?: string; body?: string }): Promise<void> {
    const page = this.getActivePage();
    await page.route(options.url, route => route.fulfill({ status: options.status || 200, contentType: options.contentType || 'application/json', body: options.body || '{}' }));
  }

  async unrouteMock(url: string): Promise<void> {
    await this.getActivePage().unroute(url);
  }

  async startTracing(): Promise<void> {
    if (!this.state) throw new Error('Browser not connected. Call connect() first.');
    await this.state.context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    this.state.tracing = true;
  }

  async stopTracing(filename = `trace-${Date.now()}.zip`): Promise<string> {
    if (!this.state?.tracing) throw new Error('Tracing is not active.');
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filepath = join(configManager.get('browser.approvedDirectories.recordings') as string, safeFilename);
    await this.state.context.tracing.stop({ path: filepath });
    this.state.tracing = false;
    return filepath;
  }

  async emulateMedia(options: { media?: 'screen' | 'print'; colorScheme?: 'light' | 'dark' | 'no-preference' }): Promise<void> {
    await this.getActivePage().emulateMedia(options);
  }

  async runPageEvaluation(expression: string, confirmDangerous: boolean): Promise<unknown> {
    if (!confirmDangerous) throw new Error('Page evaluation is blocked by default. Set confirmDangerous=true only for trusted code.');
    if (expression.length > 10000) throw new Error('Page evaluation is limited to 10,000 characters.');
    return this.getActivePage().evaluate(expression);
  }

  async navigate(options: NavigateOptions): Promise<PageSnapshot> {
    const page = this.getActivePage();
    await page.goto(options.url, {
      waitUntil: options.waitUntil || 'domcontentloaded',
      timeout: options.timeout || 30000,
      referer: options.referer
    });

    if (configManager.get('observation.screenshotOnNavigation')) {
      await this.captureScreenshot({ action: 'navigate', requirement: `Navigated to ${options.url}` });
    }

    return this.inspectPage({ includeA11y: true, includeDOM: true });
  }

  async inspectPage(options: InspectOptions = {}): Promise<PageSnapshot> {
    const page = this.getActivePage();
    const { selector, includeA11y = true, includeDOM = true, maxDepth = 50 } = options;

    let targetPage = page;
    if (selector) {
      const element = await page.$(selector);
      if (!element) throw new Error(`Element not found: ${selector}`);
      targetPage = page;
    }

    const [url, title, viewport, accessibilityTree, domSnapshot, metrics] = await Promise.all([
      targetPage.url(),
      targetPage.title(),
      targetPage.viewportSize() || { width: 1280, height: 720 },
      includeA11y ? this.getAccessibilityTree(targetPage, maxDepth) : [],
      includeDOM ? this.getDOMSnapshot(targetPage, selector) : '',
      this.getPageMetrics(targetPage)
    ]);

    return {
      url,
      title,
      viewport,
      accessibilityTree,
      domSnapshot,
      timestamp: Date.now(),
      metadata: {
        loadTime: metrics.loadTime,
        resourceCount: metrics.resourceCount,
        consoleErrors: metrics.consoleErrors
      }
    };
  }

  private async getAccessibilityTree(page: Page, maxDepth: number): Promise<AccessibilityNode[]> {
    try {
      const cdp = await this.getCDPSession(page);
      const result = await cdp.send('Accessibility.getFullAXTree', {});
      return this.filterAccessibilityTree(result.nodes, maxDepth);
    } catch {
      return [];
    }
  }

  private filterAccessibilityTree(nodes: any[], maxDepth: number): AccessibilityNode[] {
    const filterNode = (node: any, depth: number): AccessibilityNode | null => {
      if (depth > maxDepth) return null;
      if (!node.role || node.role === 'Ignored' || node.ignored) return null;

      const filtered: AccessibilityNode = {
        role: node.role,
        name: node.name?.value,
        description: node.description?.value,
        value: node.value?.value,
        url: node.url?.value,
        selected: node.selected,
        checked: node.checked,
        pressed: node.pressed,
        expanded: node.expanded,
        level: depth
      };

      if (node.children?.length) {
        filtered.children = node.children
          .map((child: any) => filterNode(child, depth + 1))
          .filter((n: AccessibilityNode | null): n is AccessibilityNode => n !== null);
      }

      return filtered;
    };

    return nodes.map((n: any) => filterNode(n, 0)).filter((n: AccessibilityNode | null): n is AccessibilityNode => n !== null);
  }

  private async getDOMSnapshot(page: Page, selector?: string): Promise<string> {
    if (selector) {
      return page.$eval(selector, el => el.outerHTML).catch(() => '');
    }
    return page.content();
  }

  private async getPageMetrics(page: Page): Promise<{ loadTime: number; resourceCount: number; consoleErrors: string[] }> {
    const timing = await page.evaluate(() => {
      type NavEntry = { loadEventEnd: number; startTime: number };
      const perf = performance as unknown as { getEntriesByType(t: string): NavEntry[] };
      const nav = perf.getEntriesByType('navigation')[0];
      return nav ? JSON.stringify({ loadEventEnd: nav.loadEventEnd, startTime: nav.startTime }) : '{}';
    });
    const resources = await page.evaluate(() => performance.getEntriesByType('resource').length);

    const t = JSON.parse(timing) as { loadEventEnd?: number; startTime?: number };
    const loadTime = t.loadEventEnd !== undefined && t.startTime !== undefined ? t.loadEventEnd - t.startTime : 0;

    return { loadTime, resourceCount: resources, consoleErrors: [] };
  }

  async captureScreenshot(options: { action: string; requirement?: string; selector?: string; fullPage?: boolean }): Promise<ScreenshotResult> {
    const page = this.getActivePage();
    const config = configManager.getConfig();
    const timestamp = Date.now();
    const filename = `screenshot-${timestamp}.png`;
    const filepath = join(config.browser.approvedDirectories.screenshots, filename);

    const screenshotOptions: any = { path: filepath, fullPage: options.fullPage ?? false };
    if (options.selector) {
      const element = await page.$(options.selector);
      if (element) {
        await element.screenshot(screenshotOptions);
      } else {
        await page.screenshot(screenshotOptions);
      }
    } else {
      await page.screenshot(screenshotOptions);
    }

    const { width, height } = page.viewportSize() || { width: 1280, height: 720 };

    const result: ScreenshotResult = {
      path: filepath,
      width,
      height,
      timestamp,
      action: options.action,
      requirement: options.requirement
    };

    this.emit('screenshot', result);
    return result;
  }

  async startRecording(options: { action: string; requirement?: string }): Promise<void> {
    if (!this.state) throw new Error('Browser not connected');

    const config = configManager.getConfig();
    const page = this.state.defaultPage;

    const timestamp = Date.now();
    const filename = `recording-${timestamp}.webm`;
    const filepath = join(config.browser.approvedDirectories.recordings, filename);

    // Playwright records video per-context (configured at context creation).
    // Mark the recording window; the video file is flushed on page close.
    this.state.recordingPage = page;
    this.recordingStartedAt = timestamp;

    this.emit('recordingStarted', { path: filepath, action: options.action, requirement: options.requirement });
  }

  async stopRecording(): Promise<RecordingResult | null> {
    if (!this.state?.recordingPage) return null;

    const page = this.state.recordingPage;
    const config = configManager.getConfig();
    const startedAt = this.recordingStartedAt ?? Date.now();
    this.recordingStartedAt = undefined;

    // Flush the context video by closing the tracked page.
    await page.close().catch(() => undefined);

    const finalPath = await this.findNewestRecording(config.browser.approvedDirectories.recordings);

    if (finalPath) {
      const result: RecordingResult = {
        path: finalPath,
        duration: Math.round((Date.now() - startedAt) / 1000),
        width: page.viewportSize()?.width || 1280,
        height: page.viewportSize()?.height || 720,
        timestamp: Date.now(),
        action: 'record',
        requirement: 'manual'
      };

      this.state.recordingPage = undefined;
      this.emit('recordingStopped', result);
      return result;
    }

    this.state.recordingPage = undefined;
    return null;
  }

  async drag(source: string, target: string): Promise<void> {
    await this.getActivePage().dragAndDrop(source, target);
  }

  async savePdf(filename = `page-${Date.now()}.pdf`): Promise<string> {
    const page = this.getActivePage();
    const config = configManager.getConfig();
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filepath = join(config.browser.approvedDirectories.downloads, safeFilename);
    await page.pdf({ path: filepath, format: 'A4', printBackground: true });
    return filepath;
  }

  async setViewportSize(width: number, height: number): Promise<void> {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
      throw new Error(`Invalid viewport size: ${width}x${height}`);
    }
    const page = this.getActivePage();
    await page.setViewportSize({ width: Math.round(width), height: Math.round(height) });
  }

  async click(options: ClickOptions): Promise<void> {
    const page = this.getActivePage();
    await page.click(this.resolveSelector(options.selector), {
      button: options.button || 'left',
      clickCount: options.clickCount || 1,
      delay: options.delay,
      position: options.position,
      modifiers: options.modifiers
    });

    if (configManager.get('observation.screenshotOnStateChange')) {
      await this.captureScreenshot({ action: 'click', requirement: `Clicked ${options.selector}` });
    }
  }

  async hover(options: { selector: string }): Promise<void> {
    const page = this.getActivePage();
    await page.hover(this.resolveSelector(options.selector));
  }

  async press(options: { selector: string; key: string }): Promise<void> {
    const page = this.getActivePage();
    await page.press(this.resolveSelector(options.selector), options.key);
  }

  async selectOption(options: { selector: string; value?: string; label?: string; index?: number }): Promise<void> {
    const page = this.getActivePage();
    const select = options.value !== undefined ? { value: options.value } : options.label !== undefined ? { label: options.label } : { index: options.index ?? 0 };
    await page.selectOption(this.resolveSelector(options.selector), select);
  }

  async check(options: { selector: string; checked?: boolean }): Promise<void> {
    const page = this.getActivePage();
    const selector = this.resolveSelector(options.selector);
    if (options.checked === false) await page.uncheck(selector);
    else await page.check(selector);
  }

  async scroll(options: { selector?: string; x?: number; y?: number }): Promise<void> {
    const page = this.getActivePage();
    const x = Math.round(options.x || 0);
    const y = Math.round(options.y || 0);
    if (options.selector) {
      await page.locator(this.resolveSelector(options.selector)).evaluate((element, offset) => element.scrollBy(offset.x, offset.y), { x, y });
    } else {
      await page.mouse.wheel(x, y);
    }
  }

  async waitFor(options: { state?: 'load' | 'domcontentloaded' | 'networkidle'; timeout?: number; milliseconds?: number }): Promise<void> {
    const page = this.getActivePage();
    if (options.milliseconds !== undefined) {
      const milliseconds = Math.min(Math.max(Math.round(options.milliseconds), 0), 30000);
      await page.waitForTimeout(milliseconds);
      return;
    }
    await page.waitForLoadState(options.state || 'domcontentloaded', { timeout: options.timeout || 30000 });
  }

  async fill(options: FillOptions): Promise<void> {
    const page = this.getActivePage();
    if (options.clearFirst) {
      await page.fill(this.resolveSelector(options.selector), '');
    }
    await page.fill(this.resolveSelector(options.selector), options.value, { timeout: options.delay });

    if (configManager.get('observation.screenshotOnStateChange')) {
      await this.captureScreenshot({ action: 'fill', requirement: `Filled ${options.selector}` });
    }
  }

  async uploadFile(options: UploadOptions): Promise<void> {
    const page = this.getActivePage();
    await page.setInputFiles(options.selector, options.filePaths);

    if (configManager.get('observation.screenshotOnStateChange')) {
      await this.captureScreenshot({ action: 'upload', requirement: `Uploaded ${options.filePaths.length} file(s)` });
    }
  }

  async downloadFile(options: DownloadOptions): Promise<string> {
    const page = this.getActivePage();
    const config = configManager.getConfig();

    const downloadPromise = page.waitForEvent('download');
    if (options.url) {
      await page.goto(options.url);
    }
    const download = await downloadPromise;

    const suggestedName = options.suggestedFilename || download.suggestedFilename();
    const timestamp = Date.now();
    const filename = `${timestamp}-${suggestedName}`;
    const filepath = join(config.browser.approvedDirectories.downloads, filename);

    await download.saveAs(filepath);
    return filepath;
  }

  async createRunContext(goal: string, requirements: string[]): Promise<RunContext> {
    const runContext: RunContext = {
      runId: `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      startTime: Date.now(),
      goal,
      requirements,
      evidence: [],
      currentUrl: '',
      currentAction: ''
    };

    if (this.state) {
      this.state.runContext = runContext;
    }

    return runContext;
  }

  addEvidence(manifest: EvidenceManifest): void {
    if (this.state?.runContext) {
      this.state.runContext.evidence.push(manifest);
    }
  }

  getRunContext(): RunContext | undefined {
    return this.state?.runContext;
  }

  private getActivePage(): Page {
    if (!this.state?.defaultPage) {
      throw new Error('Browser not connected. Call connect() first.');
    }
    return this.state.defaultPage;
  }

  private async getCDPSession(page: Page): Promise<CDPSession> {
    if (this.state?.cdpSession) return this.state.cdpSession;
    const session = await page.context().newCDPSession(page);
    this.state!.cdpSession = session;
    return session;
  }

  async generateEventId(): Promise<string> {
    this.eventIdCounter++;
    return `event-${this.eventIdCounter.toString().padStart(3, '0')}`;
  }

  private async findNewestRecording(dir: string): Promise<string | null> {
    try {
      const entries = await readdir(dir);
      const videos = entries.filter(f => f.endsWith('.webm'));
      if (videos.length === 0) return null;
      const withStats = await Promise.all(
        videos.map(async f => {
          const full = join(dir, f);
          const s = await stat(full);
          return { full, mtime: s.mtimeMs };
        })
      );
      withStats.sort((a, b) => b.mtime - a.mtime);
      return withStats[0]?.full ?? null;
    } catch {
      return null;
    }
  }
}

export const browserAdapter = new BrowserAdapter();