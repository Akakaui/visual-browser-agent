export interface BrowserConfig {
  mode: 'auto' | 'extension' | 'managed' | 'cdp';
  profile: string;
  allowedHosts: string[];
  approvedDirectories: {
    screenshots: string;
    recordings: string;
    downloads: string;
    uploads: string;
  };
}

export interface ObservationConfig {
  default: 'structured' | 'visual';
  screenshotOnNavigation: boolean;
  screenshotOnStateChange: boolean;
  recordAnimations: 'always' | 'on-demand' | 'never';
  rollingBufferSeconds: number;
  clipAfterTriggerSeconds: number;
  deduplicateFrames: boolean;
}

export interface HumanConfig {
  requireFor: ('password' | 'otp' | 'captcha' | 'account_switch' | 'public_post' | 'message_send' | 'purchase' | 'deletion')[];
  allowTakeover: boolean;
  requireResumeButton: boolean;
}

export interface RetentionConfig {
  rawVideoDays: number;
  screenshotsDays: number;
  reportsDays: number;
  maxRunSizeMb: number;
  deleteExpiredAutomatically: boolean;
  uploadArtifactsByDefault: boolean;
}

export interface SafetyConfig {
  blockPublicSubmissionByDefault: boolean;
  blockUnrestrictedCdp: boolean;
  redactSecretsFromLogs: boolean;
  restrictFilesystemToApprovedDirectories: boolean;
}

export interface VisualBrowserConfig {
  browser: BrowserConfig;
  observation: ObservationConfig;
  human: HumanConfig;
  retention: RetentionConfig;
  safety: SafetyConfig;
}

export const DEFAULT_CONFIG: VisualBrowserConfig = {
  browser: {
    mode: 'auto',
    profile: 'default',
    allowedHosts: [],
    approvedDirectories: {
      screenshots: './runs/screenshots',
      recordings: './runs/recordings',
      downloads: './runs/downloads',
      uploads: './runs/uploads'
    }
  },
  observation: {
    default: 'structured',
    screenshotOnNavigation: true,
    screenshotOnStateChange: true,
    recordAnimations: 'on-demand',
    rollingBufferSeconds: 5,
    clipAfterTriggerSeconds: 8,
    deduplicateFrames: true
  },
  human: {
    requireFor: ['password', 'otp', 'captcha', 'account_switch', 'public_post', 'message_send', 'purchase', 'deletion'],
    allowTakeover: true,
    requireResumeButton: true
  },
  retention: {
    rawVideoDays: 3,
    screenshotsDays: 14,
    reportsDays: 90,
    maxRunSizeMb: 500,
    deleteExpiredAutomatically: true,
    uploadArtifactsByDefault: false
  },
  safety: {
    blockPublicSubmissionByDefault: true,
    blockUnrestrictedCdp: true,
    redactSecretsFromLogs: true,
    restrictFilesystemToApprovedDirectories: true
  }
};

export type ConfigPath = keyof VisualBrowserConfig | `${keyof VisualBrowserConfig}.${string}`;