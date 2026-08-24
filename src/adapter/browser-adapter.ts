import { Browser, BrowserContext, Page, CDPSession, chromium } from 'playwright';
import { EventEmitter } from 'events';
import { join } from 'path';
import { mkdir, readdir, stat } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  BrowserInfo,
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ManagedBrowserState {
  browser: Browser;
  context: BrowserContext;
  defaultPage: Page;
  cdpSession?: CDPSession;
  recordingPage?: Page;
  runContext?: RunContext;
  rollingChunks: Buffer[];
}

export class BrowserAdapter extends EventEmitter {
  private state: ManagedBrowserState | null = null;
  private extensionPort: number = 9222;
  private extensionConnected: boolean = false;
  private eventIdCounter: number = 0;
  private recordingStartedAt?: number;

  async connect(options: BrowserConnectOptions): Promise<BrowserStatus> {
    const config = configManager.getConfig();

    switch (options.mode) {
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
      rollingChunks: []
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
        rollingChunks: []
      };

      this.extensionConnected = true;
      this.setupBrowserListeners(browser);

      return this.getStatus();
    } catch (error) {
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
      rollingChunks: []
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
      if (msg.type() === 'error') {
        this.emit('consoleError', msg.text());
      }
    });

    page.on('pageerror', error => {
      this.emit('pageError', error.message);
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

  async navigate(options: NavigateOptions): Promise<PageSnapshot> {
    const page = this.getActivePage();
    const startTime = Date.now();

    const response = await page.goto(options.url, {
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

  async click(options: ClickOptions): Promise<void> {
    const page = this.getActivePage();
    await page.click(options.selector, {
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
    await page.hover(options.selector);
  }

  async fill(options: FillOptions): Promise<void> {
    const page = this.getActivePage();
    if (options.clearFirst) {
      await page.fill(options.selector, '');
    }
    await page.fill(options.selector, options.value, { timeout: options.delay });

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