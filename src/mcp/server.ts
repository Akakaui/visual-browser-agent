import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { browserAdapter } from '../adapter/browser-adapter.js';
import { configManager } from '../config/index.js';

const SERVER_INSTRUCTIONS = `Visual Browser Agent - Enhanced MCP Server

This server provides browser automation with visual evidence capture, human handoff, and Agent Skills integration.

Tools are organized by risk level:
- Read-only (auto-approved): browser_status, inspect_page, capture_screenshot, review_visual_evidence
- Actions (host-controlled): browser_connect, navigate, click, fill, press, select_option, check, scroll, wait_for, drag, upload_file, download_file, record_interaction, pdf_save
- Page and locator controls: tabs, new_page, switch_page, close_page, go_back, go_forward, reload, get_text, get_attribute, is_visible
- Workflows (policy-controlled): study_website, responsive_audit, animation_study
- Human interaction (always available): ask_human, request_approval, submit_public_action, delete_artifacts

Safety: Public submissions blocked by default. Unrestricted CDP blocked. Filesystem restricted to approved directories.
Secrets redacted from logs.`;

interface MCPServerOptions {
  cdpPort?: number;
}

export async function startMCPServer(httpPort?: number, options?: MCPServerOptions): Promise<void> {
  const server = new Server(
    {
      name: 'visual-browser-agent',
      version: '0.1.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  server.setRequestHandler(InitializeRequestSchema, async () => {
    return {
      protocolVersion: '2026-07-28',
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'visual-browser-agent',
        version: '0.1.0'
      },
      instructions: SERVER_INSTRUCTIONS
    };
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'browser_status',
        description: 'Get browser connection status and active tab info',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'browser_connect',
        description: 'Connect to a browser automatically, or explicitly use existing Chrome, managed Chromium, or CDP',
        inputSchema: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['auto', 'extension', 'managed', 'cdp'], default: 'auto' },
            cdpEndpoint: { type: 'string' },
            extensionPort: { type: 'number', default: 9222 },
            profile: { type: 'string', default: 'default' },
            headless: { type: 'boolean', default: false },
            args: { type: 'array', items: { type: 'string' } }
          },
          required: []
        }
      },
      {
        name: 'navigate',
        description: 'Navigate to URL and capture structured page snapshot',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            waitUntil: { type: 'string', enum: ['load', 'domcontentloaded', 'networkidle'], default: 'domcontentloaded' },
            timeout: { type: 'number', default: 30000 },
            referer: { type: 'string' }
          },
          required: ['url']
        }
      },
      {
        name: 'inspect_page',
        description: 'Get structured page inspection (URL, title, viewport, accessibility tree, DOM)',
        inputSchema: {
          type: 'object',
          properties: {
            selector: { type: 'string' },
            includeA11y: { type: 'boolean', default: true },
            includeDOM: { type: 'boolean', default: true },
            maxDepth: { type: 'number', default: 50 }
          }
        }
      },
      {
        name: 'capture_screenshot',
        description: 'Capture screenshot of current page or element',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string' },
            requirement: { type: 'string' },
            selector: { type: 'string' },
            fullPage: { type: 'boolean', default: false }
          },
          required: ['action']
        }
      },
      {
        name: 'record_interaction',
        description: 'Start/stop recording a short video clip',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['start', 'stop'] },
            requirement: { type: 'string' }
          },
          required: ['action']
        }
      },
      {
        name: 'review_visual_evidence',
        description: 'Review captured screenshots/recordings against a requirement (vision analysis)',
        inputSchema: {
          type: 'object',
          properties: {
            artifactPaths: { type: 'array', items: { type: 'string' } },
            requirement: { type: 'string' },
            context: { type: 'string' }
          },
          required: ['artifactPaths', 'requirement']
        }
      },
      {
        name: 'click',
        description: 'Click an element',
        inputSchema: {
          type: 'object',
          properties: {
            selector: { type: 'string' },
            button: { type: 'string', enum: ['left', 'right', 'middle'], default: 'left' },
            clickCount: { type: 'number', default: 1 },
            delay: { type: 'number' },
            position: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } } },
            modifiers: { type: 'array', items: { type: 'string', enum: ['Alt', 'Control', 'Meta', 'Shift'] } }
          },
          required: ['selector']
        }
      },
      {
        name: 'fill',
        description: 'Fill a form field',
        inputSchema: {
          type: 'object',
          properties: {
            selector: { type: 'string' },
            value: { type: 'string' },
            delay: { type: 'number' },
            clearFirst: { type: 'boolean', default: true }
          },
          required: ['selector', 'value']
        }
      },
      {
        name: 'press',
        description: 'Press a keyboard key or key combination on an element',
        inputSchema: {
          type: 'object',
          properties: { selector: { type: 'string' }, key: { type: 'string' } },
          required: ['selector', 'key']
        }
      },
      {
        name: 'select_option',
        description: 'Select an option in a native select element',
        inputSchema: {
          type: 'object',
          properties: { selector: { type: 'string' }, value: { type: 'string' }, label: { type: 'string' }, index: { type: 'number' } },
          required: ['selector']
        }
      },
      {
        name: 'check',
        description: 'Check or uncheck a checkbox or radio control',
        inputSchema: {
          type: 'object',
          properties: { selector: { type: 'string' }, checked: { type: 'boolean', default: true } },
          required: ['selector']
        }
      },
      {
        name: 'scroll',
        description: 'Scroll the page or a scrollable element',
        inputSchema: {
          type: 'object',
          properties: { selector: { type: 'string' }, x: { type: 'number', default: 0 }, y: { type: 'number', default: 500 } }
        }
      },
      {
        name: 'wait_for',
        description: 'Wait for a page load state or a bounded duration',
        inputSchema: {
          type: 'object',
          properties: { state: { type: 'string', enum: ['load', 'domcontentloaded', 'networkidle'] }, timeout: { type: 'number' }, milliseconds: { type: 'number' } }
        }
      },
      {
        name: 'drag',
        description: 'Drag an element to another element',
        inputSchema: { type: 'object', properties: { source: { type: 'string' }, target: { type: 'string' } }, required: ['source', 'target'] }
      },
      {
        name: 'pdf_save',
        description: 'Save the active page as a PDF in the approved downloads directory',
        inputSchema: { type: 'object', properties: { filename: { type: 'string' } } }
      },
      {
        name: 'tabs',
        description: 'List open pages/tabs and their URLs and titles',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'new_page',
        description: 'Open a new page and optionally navigate to a URL',
        inputSchema: { type: 'object', properties: { url: { type: 'string' } } }
      },
      {
        name: 'switch_page',
        description: 'Switch the active page by its tab index',
        inputSchema: { type: 'object', properties: { index: { type: 'number' } }, required: ['index'] }
      },
      {
        name: 'close_page',
        description: 'Close a page by tab index, defaulting to the active page',
        inputSchema: { type: 'object', properties: { index: { type: 'number' } } }
      },
      {
        name: 'go_back',
        description: 'Navigate the active page back in history',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'go_forward',
        description: 'Navigate the active page forward in history',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'reload',
        description: 'Reload the active page',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'get_text',
        description: 'Read visible text from a selector',
        inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] }
      },
      {
        name: 'get_attribute',
        description: 'Read an attribute from a selector',
        inputSchema: { type: 'object', properties: { selector: { type: 'string' }, name: { type: 'string' } }, required: ['selector', 'name'] }
      },
      {
        name: 'is_visible',
        description: 'Check whether a selector is visible',
        inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] }
      },
      {
        name: 'locator_ref',
        description: 'Create a stable locator reference from a selector for later actions/assertions',
        inputSchema: { type: 'object', properties: { selector: { type: 'string' } }, required: ['selector'] }
      },
      {
        name: 'assert',
        description: 'Run a Playwright-style web-first locator assertion',
        inputSchema: { type: 'object', properties: { selector: { type: 'string' }, assertion: { type: 'string', enum: ['visible', 'hidden', 'enabled', 'disabled', 'checked', 'unchecked', 'text', 'count'] }, expected: { type: ['string', 'number'] } }, required: ['selector', 'assertion'] }
      },
      {
        name: 'frames',
        description: 'List frames in the active page',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'inspect_frame',
        description: 'Inspect a frame by index',
        inputSchema: { type: 'object', properties: { index: { type: 'number' } }, required: ['index'] }
      },
      {
        name: 'handle_dialog',
        description: 'Configure the next page dialog to be accepted or dismissed',
        inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['accept', 'dismiss'] }, promptText: { type: 'string' } }, required: ['action'] }
      },
      {
        name: 'cookies',
        description: 'List cookies for the active browser context',
        inputSchema: { type: 'object', properties: { urls: { type: 'array', items: { type: 'string' } } } }
      },
      {
        name: 'cookies_clear',
        description: 'Clear all cookies in the active browser context',
        inputSchema: { type: 'object', properties: { confirm: { type: 'boolean' } }, required: ['confirm'] }
      },
      {
        name: 'storage_state_save',
        description: 'Save cookies and local storage to an approved artifact path',
        inputSchema: { type: 'object', properties: { filename: { type: 'string' } } }
      },
      {
        name: 'network_requests',
        description: 'List recent requests observed in the active session',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'network_route',
        description: 'Mock matching requests with a controlled response',
        inputSchema: { type: 'object', properties: { url: { type: 'string' }, status: { type: 'number' }, contentType: { type: 'string' }, body: { type: 'string' } }, required: ['url'] }
      },
      {
        name: 'network_unroute',
        description: 'Remove a request mock',
        inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] }
      },
      {
        name: 'console_messages',
        description: 'List recent console and page-error messages',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'trace_start',
        description: 'Start a Playwright trace with screenshots and DOM snapshots',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'trace_stop',
        description: 'Stop tracing and save the trace to approved artifacts',
        inputSchema: { type: 'object', properties: { filename: { type: 'string' } } }
      },
      {
        name: 'emulate_media',
        description: 'Emulate print/screen media and color scheme',
        inputSchema: { type: 'object', properties: { media: { type: 'string', enum: ['screen', 'print'] }, colorScheme: { type: 'string', enum: ['light', 'dark', 'no-preference'] } } }
      },
      {
        name: 'evaluate',
        description: 'Evaluate trusted JavaScript on the active page; blocked unless explicitly confirmed',
        inputSchema: { type: 'object', properties: { expression: { type: 'string' }, confirmDangerous: { type: 'boolean', default: false } }, required: ['expression'] }
      },
      {
        name: 'upload_file',
        description: 'Upload file(s) to input element',
        inputSchema: {
          type: 'object',
          properties: {
            selector: { type: 'string' },
            filePaths: { type: 'array', items: { type: 'string' } }
          },
          required: ['selector', 'filePaths']
        }
      },
      {
        name: 'download_file',
        description: 'Download a file from the page',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            suggestedFilename: { type: 'string' },
            saveAs: { type: 'boolean' }
          }
        }
      },
      {
        name: 'study_website',
        description: 'Study a website\'s visual design, interactions, responsiveness, and motion',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            viewports: { type: 'array', items: { type: 'object', properties: { width: { type: 'number' }, height: { type: 'number' }, name: { type: 'string' } } } },
            captureAnimations: { type: 'boolean', default: true },
            maxPages: { type: 'number', default: 3 }
          },
          required: ['url']
        }
      },
      {
        name: 'responsive_audit',
        description: 'Audit responsive behavior across viewports',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            viewports: { type: 'array', items: { type: 'object', properties: { width: { type: 'number' }, height: { type: 'number' }, name: { type: 'string' } } } },
            checkpoints: { type: 'array', items: { type: 'string' } }
          },
          required: ['url']
        }
      },
      {
        name: 'animation_study',
        description: 'Study and record animations/transitions on a page',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            selectors: { type: 'array', items: { type: 'string' } },
            triggerActions: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, selector: { type: 'string' } } } }
          },
          required: ['url']
        }
      },
      {
        name: 'ask_human',
        description: 'Ask human a structured question (fallback when MCP elicitation unavailable)',
        inputSchema: {
          type: 'object',
          properties: {
            runId: { type: 'string' },
            question: { type: 'string' },
            options: { type: 'array', items: { type: 'string' } },
            sensitive: { type: 'boolean', default: false },
            formSchema: { type: 'object' }
          },
          required: ['runId', 'question']
        }
      },
      {
        name: 'request_approval',
        description: 'Request approval for a high-risk action',
        inputSchema: {
          type: 'object',
          properties: {
            runId: { type: 'string' },
            action: { type: 'string' },
            reason: { type: 'string' },
            details: { type: 'object' }
          },
          required: ['runId', 'action', 'reason']
        }
      },
      {
        name: 'submit_public_action',
        description: 'Submit a public action (post, publish, purchase, etc.) - requires explicit approval',
        inputSchema: {
          type: 'object',
          properties: {
            runId: { type: 'string' },
            action: { type: 'string' },
            target: { type: 'string' },
            payload: { type: 'object' }
          },
          required: ['runId', 'action', 'target']
        }
      },
      {
        name: 'delete_artifacts',
        description: 'Delete captured artifacts (screenshots, recordings)',
        inputSchema: {
          type: 'object',
          properties: {
            paths: { type: 'array', items: { type: 'string' } },
            confirm: { type: 'boolean', default: false }
          },
          required: ['paths', 'confirm']
        }
      }
    ]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'browser_status': {
          const status = await browserAdapter.getStatus();
          return { content: [{ type: 'text', text: JSON.stringify(status, null, 2) }] };
        }

        case 'browser_connect': {
          const status = await browserAdapter.connect({ mode: 'auto', ...(args as any || {}) });
          return { content: [{ type: 'text', text: JSON.stringify(status, null, 2) }] };
        }

        case 'navigate': {
          const snapshot = await browserAdapter.navigate(args as any);
          return { content: [{ type: 'text', text: JSON.stringify(snapshot, null, 2) }] };
        }

        case 'inspect_page': {
          const snapshot = await browserAdapter.inspectPage(args as any);
          return { content: [{ type: 'text', text: JSON.stringify(snapshot, null, 2) }] };
        }

        case 'capture_screenshot': {
          const result = await browserAdapter.captureScreenshot(args as any);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'record_interaction': {
          const action = (args as any)?.action;
          if (action === 'start') {
            await browserAdapter.startRecording(args as any);
            return { content: [{ type: 'text', text: 'Recording started' }] };
          } else {
            const result = await browserAdapter.stopRecording();
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
          }
        }

        case 'click': {
          await browserAdapter.click(args as any);
          return { content: [{ type: 'text', text: 'Clicked successfully' }] };
        }

        case 'fill': {
          await browserAdapter.fill(args as any);
          return { content: [{ type: 'text', text: 'Filled successfully' }] };
        }

        case 'press': {
          await browserAdapter.press(args as any);
          return { content: [{ type: 'text', text: 'Pressed successfully' }] };
        }

        case 'select_option': {
          await browserAdapter.selectOption(args as any);
          return { content: [{ type: 'text', text: 'Option selected successfully' }] };
        }

        case 'check': {
          await browserAdapter.check(args as any);
          return { content: [{ type: 'text', text: 'Checkbox state updated successfully' }] };
        }

        case 'scroll': {
          await browserAdapter.scroll(args as any);
          return { content: [{ type: 'text', text: 'Scrolled successfully' }] };
        }

        case 'wait_for': {
          await browserAdapter.waitFor(args as any);
          return { content: [{ type: 'text', text: 'Wait completed successfully' }] };
        }

        case 'drag': {
          await browserAdapter.drag((args as any).source, (args as any).target);
          return { content: [{ type: 'text', text: 'Dragged successfully' }] };
        }

        case 'pdf_save': {
          const path = await browserAdapter.savePdf((args as any)?.filename);
          return { content: [{ type: 'text', text: `PDF saved to: ${path}` }] };
        }

        case 'tabs': {
          return { content: [{ type: 'text', text: JSON.stringify(await browserAdapter.listPages(), null, 2) }] };
        }

        case 'new_page': {
          return { content: [{ type: 'text', text: JSON.stringify(await browserAdapter.newPage((args as any)?.url), null, 2) }] };
        }

        case 'switch_page': {
          return { content: [{ type: 'text', text: JSON.stringify(await browserAdapter.switchPage((args as any).index), null, 2) }] };
        }

        case 'close_page': {
          await browserAdapter.closePage((args as any)?.index);
          return { content: [{ type: 'text', text: 'Page closed successfully' }] };
        }

        case 'go_back': {
          return { content: [{ type: 'text', text: JSON.stringify(await browserAdapter.goBack(), null, 2) }] };
        }

        case 'go_forward': {
          return { content: [{ type: 'text', text: JSON.stringify(await browserAdapter.goForward(), null, 2) }] };
        }

        case 'reload': {
          return { content: [{ type: 'text', text: JSON.stringify(await browserAdapter.reload(), null, 2) }] };
        }

        case 'get_text': {
          return { content: [{ type: 'text', text: await browserAdapter.getText((args as any).selector) }] };
        }

        case 'get_attribute': {
          const value = await browserAdapter.getAttribute((args as any).selector, (args as any).name);
          return { content: [{ type: 'text', text: value ?? '' }] };
        }

        case 'is_visible': {
          return { content: [{ type: 'text', text: String(await browserAdapter.isVisible((args as any).selector)) }] };
        }

        case 'locator_ref': {
          return { content: [{ type: 'text', text: JSON.stringify(await browserAdapter.createLocatorRef((args as any).selector), null, 2) }] };
        }

        case 'assert': {
          return { content: [{ type: 'text', text: JSON.stringify(await browserAdapter.assertLocator(args as any), null, 2) }] };
        }

        case 'frames': {
          return { content: [{ type: 'text', text: JSON.stringify(await browserAdapter.listFrames(), null, 2) }] };
        }

        case 'inspect_frame': {
          return { content: [{ type: 'text', text: JSON.stringify(await browserAdapter.inspectFrame((args as any).index), null, 2) }] };
        }

        case 'handle_dialog': {
          await browserAdapter.setDialogAction((args as any).action, (args as any).promptText);
          return { content: [{ type: 'text', text: 'Dialog policy configured' }] };
        }

        case 'cookies': {
          return { content: [{ type: 'text', text: JSON.stringify(await browserAdapter.getCookies((args as any)?.urls), null, 2) }] };
        }

        case 'cookies_clear': {
          if (!(args as any)?.confirm) throw new Error('Cookie clearing requires confirm=true.');
          await browserAdapter.clearCookies();
          return { content: [{ type: 'text', text: 'Cookies cleared' }] };
        }

        case 'storage_state_save': {
          return { content: [{ type: 'text', text: `Storage state saved to: ${await browserAdapter.saveStorageState((args as any)?.filename)}` }] };
        }

        case 'network_requests': {
          return { content: [{ type: 'text', text: JSON.stringify(await browserAdapter.getNetworkRequests(), null, 2) }] };
        }

        case 'network_route': {
          await browserAdapter.routeMock(args as any);
          return { content: [{ type: 'text', text: 'Network route configured' }] };
        }

        case 'network_unroute': {
          await browserAdapter.unrouteMock((args as any).url);
          return { content: [{ type: 'text', text: 'Network route removed' }] };
        }

        case 'console_messages': {
          return { content: [{ type: 'text', text: JSON.stringify(await browserAdapter.getConsoleMessages(), null, 2) }] };
        }

        case 'trace_start': {
          await browserAdapter.startTracing();
          return { content: [{ type: 'text', text: 'Tracing started' }] };
        }

        case 'trace_stop': {
          return { content: [{ type: 'text', text: `Trace saved to: ${await browserAdapter.stopTracing((args as any)?.filename)}` }] };
        }

        case 'emulate_media': {
          await browserAdapter.emulateMedia(args as any);
          return { content: [{ type: 'text', text: 'Media emulation applied' }] };
        }

        case 'evaluate': {
          const result = await browserAdapter.runPageEvaluation((args as any).expression, Boolean((args as any).confirmDangerous));
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'upload_file': {
          await browserAdapter.uploadFile(args as any);
          return { content: [{ type: 'text', text: 'Uploaded successfully' }] };
        }

        case 'download_file': {
          const path = await browserAdapter.downloadFile(args as any);
          return { content: [{ type: 'text', text: `Downloaded to: ${path}` }] };
        }

        case 'study_website': {
          const result = await studyWebsite(args as any);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'responsive_audit': {
          const result = await responsiveAudit(args as any);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'animation_study': {
          const result = await animationStudy(args as any);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }

        case 'ask_human': {
          const response = await askHuman(args as any);
          return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
        }

        case 'request_approval': {
          const response = await requestApproval(args as any);
          return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
        }

        case 'submit_public_action': {
          throw new Error('Public action blocked by default. Call request_approval first, then retry only with an approval record.');
        }

        case 'delete_artifacts': {
          if (!(args as any)?.confirm) throw new Error('Artifact deletion requires confirm=true.');
          const { deleteArtifacts } = await import('../retention/manager.js');
          await deleteArtifacts((args as any)?.paths || []);
          return { content: [{ type: 'text', text: 'Artifacts deleted' }] };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  });

  if (httpPort) {
    const { StreamableHTTPServerTransport } = await import('@modelcontextprotocol/sdk/server/streamableHttp.js');
    const transport = new StreamableHTTPServerTransport();
    await server.connect(transport);
    console.log(`MCP server listening on http://localhost:${httpPort}`);
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Visual Browser Agent MCP server started (stdio)');
  }

  // Auto-connect browser on startup if CDP port provided
  if (options?.cdpPort) {
    try {
      await browserAdapter.connect({ mode: 'cdp', cdpPort: options.cdpPort });
      console.error(`Chrome connected on port ${options.cdpPort}`);
    } catch (err) {
      console.error(`Chrome auto-connect failed: ${err instanceof Error ? err.message : String(err)}`);
      console.error('You can connect manually using the browser_connect tool.');
    }
  }
}

async function studyWebsite(args: any): Promise<any> {
  const { url, viewports = [{ width: 1280, height: 720, name: 'desktop' }, { width: 375, height: 667, name: 'mobile' }], captureAnimations = true, maxPages = 3 } = args;
  const runId = await browserAdapter.generateEventId();
  await browserAdapter.createRunContext(`Study website: ${url}`, ['Visual design', 'Interactions', 'Responsiveness', 'Motion']);

  const results: any = { url, viewports: [], pages: [] };

  for (const viewport of viewports) {
    await browserAdapter.setViewportSize(viewport.width, viewport.height);
    await browserAdapter.navigate({ url, waitUntil: 'networkidle' });
    await browserAdapter.captureScreenshot({ action: `viewport-${viewport.name}`, requirement: `${viewport.name} layout` });

    const snapshot = await browserAdapter.inspectPage({ includeA11y: true, includeDOM: false });
    results.viewports.push({ name: viewport.name, width: viewport.width, height: viewport.height, snapshot });

    if (captureAnimations) {
      await browserAdapter.startRecording({ action: `animation-${viewport.name}`, requirement: 'Capture animations' });
      await new Promise(r => setTimeout(r, 3000));
      await browserAdapter.stopRecording();
    }
  }

  return results;
}

async function responsiveAudit(args: any): Promise<any> {
  const { url, viewports = [{ width: 1280, height: 720, name: 'desktop' }, { width: 768, height: 1024, name: 'tablet' }, { width: 375, height: 667, name: 'mobile' }], checkpoints = ['navigation', 'hero', 'content', 'footer'] } = args;

  const results: any = { url, viewports: [], issues: [] };

  for (const viewport of viewports) {
    await browserAdapter.setViewportSize(viewport.width, viewport.height);
    await browserAdapter.navigate({ url, waitUntil: 'networkidle' });
    await browserAdapter.captureScreenshot({ action: `responsive-${viewport.name}`, requirement: `${viewport.name} breakpoint` });

    const snapshot = await browserAdapter.inspectPage({ includeA11y: true, includeDOM: false });
    results.viewports.push({ name: viewport.name, width: viewport.width, height: viewport.height, snapshot });
  }

  return results;
}

async function animationStudy(args: any): Promise<any> {
  const { url, selectors = [], triggerActions = [] } = args;

  await browserAdapter.navigate({ url, waitUntil: 'networkidle' });
  await browserAdapter.startRecording({ action: 'animation-study', requirement: 'Capture animations' });

  for (const trigger of triggerActions) {
    if (trigger.type === 'click') {
      await browserAdapter.click({ selector: trigger.selector });
    } else if (trigger.type === 'hover') {
      await browserAdapter.hover({ selector: trigger.selector });
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  const recording = await browserAdapter.stopRecording();
  return { url, recording, triggers: triggerActions };
}

async function askHuman(args: any): Promise<any> {
  const { runId, question, options = ['resume', 'cancel'], sensitive = false, formSchema } = args;

  console.error(`\n❓ HUMAN INPUT REQUIRED (${runId})`);
  console.error(`Question: ${question}`);
  console.error(`Options: ${options.join(', ')}`);
  if (formSchema) console.error(`Form schema: ${JSON.stringify(formSchema)}`);

  const readline = await import('readline/promises');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    const answer = await rl.question('Your response: ');
    rl.close();

    if (options.includes(answer)) {
      return { action: answer };
    }
    return { action: 'input', input: { response: answer } };
  } catch {
    rl.close();
    return { action: 'cancel' };
  }
}

async function requestApproval(args: any): Promise<any> {
  const { runId, action, reason, details } = args;

  console.error(`\n⚠️  APPROVAL REQUIRED (${runId})`);
  console.error(`Action: ${action}`);
  console.error(`Reason: ${reason}`);
  if (details) console.error(`Details: ${JSON.stringify(details)}`);

  const readline = await import('readline/promises');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    const answer = await rl.question('Approve? (yes/no): ');
    rl.close();
    return { approved: answer.toLowerCase() === 'yes' };
  } catch {
    rl.close();
    return { approved: false };
  }
}