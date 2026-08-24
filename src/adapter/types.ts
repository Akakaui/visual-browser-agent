export interface BrowserInfo {
  browserType: 'chromium' | 'firefox' | 'webkit';
  version: string;
  executablePath: string;
  isManaged: boolean;
}

export interface PageSnapshot {
  url: string;
  title: string;
  viewport: { width: number; height: number };
  accessibilityTree: AccessibilityNode[];
  domSnapshot: string;
  timestamp: number;
  metadata: {
    loadTime: number;
    resourceCount: number;
    consoleErrors: string[];
  };
}

export interface AccessibilityNode {
  role: string;
  name?: string;
  description?: string;
  value?: string;
  url?: string;
  selected?: boolean;
  checked?: boolean;
  pressed?: boolean;
  expanded?: boolean;
  level?: number;
  children?: AccessibilityNode[];
}

export interface ScreenshotResult {
  path: string;
  width: number;
  height: number;
  timestamp: number;
  action: string;
  requirement?: string;
}

export interface RecordingResult {
  path: string;
  duration: number;
  width: number;
  height: number;
  timestamp: number;
  action: string;
  requirement?: string;
}

export interface NavigateOptions {
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  timeout?: number;
  referer?: string;
}

export interface ClickOptions {
  selector: string;
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  delay?: number;
  position?: { x: number; y: number };
  modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[];
}

export interface FillOptions {
  selector: string;
  value: string;
  delay?: number;
  clearFirst?: boolean;
}

export interface UploadOptions {
  selector: string;
  filePaths: string[];
}

export interface DownloadOptions {
  url?: string;
  suggestedFilename?: string;
  saveAs?: boolean;
}

export interface InspectOptions {
  selector?: string;
  includeA11y?: boolean;
  includeDOM?: boolean;
  maxDepth?: number;
}

export interface BrowserConnectOptions {
  mode: 'auto' | 'extension' | 'managed' | 'cdp';
  cdpEndpoint?: string;
  cdpPort?: number;
  extensionPort?: number;
  profile?: string;
  headless?: boolean;
  args?: string[];
}

export interface BrowserStatus {
  connected: boolean;
  mode: 'extension' | 'managed' | 'cdp' | 'disconnected';
  browserInfo?: BrowserInfo;
  activeTab?: {
    url: string;
    title: string;
  };
  tabs?: Array<{
    id: string;
    url: string;
    title: string;
    active: boolean;
  }>;
  approvedDirectories: string[];
}

export interface HumanGateRequest {
  runId: string;
  reason: string;
  currentUrl: string;
  screenshot?: string;
  requestedAction: string;
  options: string[];
  sensitive: boolean;
  formSchema?: Record<string, any>;
}

export interface HumanGateResponse {
  action: 'resume' | 'cancel' | 'input';
  input?: Record<string, any>;
}

export interface EvidenceManifest {
  eventId: string;
  action: string;
  requirement: string;
  artifacts: string[];
  review: {
    passed: boolean;
    confidence: number;
    findings: string[];
  };
  nextDecision: 'continue' | 'pause' | 'human' | 'complete' | 'retry';
}

export interface RunContext {
  runId: string;
  startTime: number;
  goal: string;
  requirements: string[];
  evidence: EvidenceManifest[];
  currentUrl: string;
  currentAction: string;
}