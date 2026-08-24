import { SpecialistMode, PlannerStep } from './types.js';

const BASE_STEPS = ['connect-browser', 'navigate', 'inspect-structured'] as const;

const MODE_EXTRAS: Record<SpecialistMode, string[]> = {
  observe: ['capture-screenshot'],
  'website-study': ['record-clip', 'review-evidence'],
  'responsive-audit': ['review-evidence'],
  'animation-study': ['record-clip', 'review-evidence'],
  'visual-regression': ['capture-screenshot', 'review-evidence'],
  'accessibility-visual': ['capture-screenshot'],
  'visual-debug': ['record-clip', 'review-evidence'],
  'workflow-observe': ['record-clip'],
  'public-research': [],
  'lead-research': [],
  'social-draft': ['ask-human'],
  monitor: ['capture-screenshot']
};

function buildSteps(mode: SpecialistMode): PlannerStep[] {
  const names = [...BASE_STEPS, ...MODE_EXTRAS[mode], 'synthesize-report', 'cleanup'];
  return names.map((name, i) => ({
    id: `step-${i}`,
    name,
    description: describe(name),
    optional: name === 'cleanup'
  }));
}

function describe(stepName: string): string {
  const descriptions: Record<string, string> = {
    'connect-browser': 'Connect to managed Chromium or authorized Chrome tab',
    navigate: 'Navigate to the task start URL',
    'inspect-structured': 'Capture structured page state (URL, title, a11y tree)',
    'capture-screenshot': 'Capture targeted screenshot per evidence policy',
    'record-clip': 'Record short clip for motion/timing evidence',
    'review-evidence': 'Review captured artifacts against requirements',
    'ask-human': 'Pause for human input when policy requires it',
    'synthesize-report': 'Write decision-ready report with findings',
    cleanup: 'Apply retention policy to temporary artifacts'
  };
  return descriptions[stepName] ?? `Execute ${stepName}`;
}

export class SpecialistPlanner {
  private readonly steps: PlannerStep[];

  constructor(mode: SpecialistMode) {
    this.steps = buildSteps(mode);
  }

  plan(): PlannerStep[] {
    return this.steps;
  }

  nextStep(completedSteps: string[]): PlannerStep | null {
    return this.steps.find(s => !s.optional && !completedSteps.includes(s.name)) ?? null;
  }
}