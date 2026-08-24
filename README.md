# Visual Browser Agent

> **A local-first visual browser specialist for coding agents.** It uses Playwright to operate authorized Chrome sessions, structured inspection for speed, adaptive screenshots and recordings for visual reasoning, and MCP/Agent Skills to work across all major coding-agent hosts.

---

## What Is This?

Visual Browser Agent is an npm package that gives AI coding agents **eyes and hands** for the web. It connects to a real Chrome or Chromium browser and provides structured page inspection, visual evidence capture, human-in-the-loop handoff, and reusable Agent Skills — all through a standard MCP server that works with 12+ coding agents out of the box.

**It is NOT:**
- A new browser engine
- A basic Playwright MCP wrapper
- A chatbot with screenshots

**It IS:**
- A **specialized visual-browser agent** that autonomously decides when visual evidence is needed, analyzes recordings efficiently, and returns decision-ready results to the parent agent
- An **evidence-based workflow engine** that uses structured DOM state first and visual evidence only when it can change the decision
- A **human-gated automation system** that pauses for login, CAPTCHA, 2FA, and sensitive actions

---

## The Problem It Solves

AI coding agents can read code and generate text, but they're blind to the rendered web. They can't:

- See if a button is actually visible on mobile
- Verify an animation plays smoothly
- Check if a modal opens correctly
- Confirm a form validation error appears
- Test responsive breakpoints
- Detect layout shifts or rendering bugs

**Visual Browser Agent solves this** by giving agents structured browser inspection (fast, cheap), targeted screenshots (when layout matters), short video recordings (when motion matters), and human handoff (when authentication or sensitive actions are needed).

---

## How It Works

```
Your AI Agent (Claude Code, Cursor, Gemini CLI, etc.)
              │
              │ MCP protocol (stdio or Streamable HTTP)
              ▼
┌─────────────────────────────┐
│  Visual Browser Agent       │
│  MCP Server (18 tools)      │
│                             │
│  ┌─────────────────────┐    │
│  │ Browser Adapter     │    │  Playwright + CDP
│  │ (managed Chromium   │    │  → real Chrome sessions
│  │  or existing tab)   │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ Evidence Router     │    │  Structured DOM → screenshot → video → human
│  │ (observation levels │    │  Only captures when evidence can change decision
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ Approval Service    │    │  Risk-based tool approval gates
│  │ (low/medium/high)   │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ 18 Agent Skills     │    │  Portable, reusable workflows
│  └─────────────────────┘    │
└─────────────────────────────┘
              │
              ▼
      Chrome / Chromium
```

### Four Observation Levels

| Level | What the agent sees | When it's used |
|-------|-------------------|----------------|
| **0. Structured** | URL, title, accessibility tree, relevant DOM | Normal navigation, forms |
| **1. Targeted screenshot** | Full page or cropped region after state change | Layout, modal, tooltip, responsive checks |
| **2. Short evidence clip** | A few seconds around interaction/animation | Motion, drag, hover, scrolling, transitions |
| **3. Human live view** | Live browser window or local streamed view | Login, CAPTCHA, 2FA, sensitive approval |

The default is Level 0. The evidence router promotes the level only when a trigger or task requirement justifies it.

---

## Installation

```bash
# One command installs everything
npx visual-browser-agent init
```

This will:
1. Check Node.js, Playwright, FFmpeg, and filesystem permissions
2. Install managed Chromium (or configure extension mode)
3. Create `visual-browser-agent.yaml` config
4. Create approved artifact directories
5. Install 18 portable Agent Skills
6. Run a test page
7. Display next steps

### Requirements

- **Node.js** ≥ 20
- **Playwright** (auto-installed)
- **FFmpeg** (optional, for video recording)
- **Chrome/Chromium** (for extension mode) or managed Chromium

---

## Quick Start

### 1. Initialize

```bash
npx visual-browser-agent init
```

### 2. Connect to your agent

```bash
# Start MCP server
npx visual-browser-agent mcp

# Or generate host-specific config
npx visual-browser-agent host install claude-code
npx visual-browser-agent host install cursor
npx visual-browser-agent host install gemini
```

### 3. Ask your agent

Once connected via MCP, ask your agent:

> "Study this website's visual design and interactions. Check desktop and mobile layouts. Record only important animations. Review the screenshots and clips yourself, then produce an evidence-based report. Ask me only if login, CAPTCHA, 2FA, or a sensitive action is required."

---

## MCP Tools (18 tools)

### Status & Connection
| Tool | Read-only | Description |
|------|-----------|-------------|
| `browser_status` | Yes | Get browser connection status and active tab info |
| `browser_connect` | No | Connect to browser (managed, extension, or CDP) |

### Navigation & Inspection
| Tool | Read-only | Description |
|------|-----------|-------------|
| `navigate` | No | Navigate to URL and capture structured page snapshot |
| `inspect_page` | Yes | Get accessibility tree, DOM snapshot, viewport info |
| `capture_screenshot` | Yes | Capture screenshot of page or element |
| `record_interaction` | Yes | Start/stop recording short video clip |
| `review_visual_evidence` | Yes | Vision-based review of captured artifacts |

### Interaction
| Tool | Read-only | Description |
|------|-----------|-------------|
| `click` | No | Click an element |
| `fill` | No | Fill a form field |
| `upload_file` | No | Upload file(s) to input element |
| `download_file` | No | Download a file from the page |

### Workflows
| Tool | Risk | Description |
|------|------|-------------|
| `study_website` | Medium | Study design, interactions, responsiveness, motion |
| `responsive_audit` | Medium | Audit responsive behavior across viewports |
| `animation_study` | Medium | Study and record animations/transitions |

### Human-in-the-Loop
| Tool | Risk | Description |
|------|------|-------------|
| `ask_human` | Always | Ask human a structured question |
| `request_approval` | Always | Request approval for high-risk action |
| `submit_public_action` | High | Submit public action (post, publish, purchase) |
| `delete_artifacts` | Medium | Delete captured artifacts |

---

## Specialist Agent Modes

The Visual Browser Agent can run as a standalone specialist with 12 distinct modes:

| Mode | What it does | Default output |
|------|-------------|----------------|
| `observe` | Read and summarize a page | Structured summary |
| `website-study` | Analyze design, structure, interaction, motion | Inspiration/research report |
| `responsive-audit` | Compare viewport states | Matrix of pass/fail findings |
| `animation-study` | Analyze transitions and motion | Motion timeline and findings |
| `visual-regression` | Compare against baseline | Diff report with evidence |
| `accessibility-visual` | Check rendered accessibility signals | Accessibility/visual report |
| `visual-debug` | Investigate a browser-visible defect | Reproduction and evidence package |
| `workflow-observe` | Learn a process without changing state | Step-by-step workflow map |
| `public-research` | Collect permitted public information | Source-linked dataset |
| `lead-research` | Find public business leads | Deduplicated CSV/JSON |
| `social-draft` | Prepare social content without publishing | Draft queue requiring approval |
| `monitor` | Detect meaningful page changes over time | Change notification |

### Running a Specialist

```bash
# Run a website study
npx visual-browser-agent agent run --mode website-study https://example.com

# Run a responsive audit
npx visual-browser-agent agent run --mode responsive-audit http://localhost:3000

# Review a previous run
npx visual-browser-agent agent review ./runs/task-001
```

---

## Agent Skills (18 portable skills)

Every skill is a reusable workflow package that teaches the agent how to perform specific visual-browser tasks. Skills follow the open Agent Skills standard and work across all supported hosts.

| Skill | Purpose | Risk |
|-------|---------|------|
| `browser-navigation` | Core navigation, clicking, forms | Low |
| `website-study` | Design, UX, responsiveness, motion analysis | Medium |
| `design-inspiration-study` | Study public sites for design patterns | Medium |
| `animation-study` | Animation/transition capture & analysis | Low |
| `responsive-audit` | Breakpoint testing, touch targets | Low |
| `visual-regression` | Compare screenshots against baseline | Low |
| `accessibility-review` | Visual accessibility checks | Low |
| `visual-debugging` | Layout/rendering issue debugging | Low |
| `research-and-source-capture` | Collect docs, examples, diagrams | Low |
| `public-business-lead-research` | Find public business leads | Medium |
| `social-draft-and-approval` | Prepare social content without publishing | High |
| `workflow-observation` | Observe workflows without changing state | Low |
| `video-evidence-review` | Analyze long recordings efficiently | Low |
| `artifact-retention` | Manage artifact lifecycle and cleanup | Medium |
| `human-handoff` | Login, CAPTCHA, 2FA, approvals | High |
| `evidence-review` | Vision-based evidence assessment | Low |
| `visual-capture` | Screenshots, recordings, evidence | Low |
| `retention-cleanup` | Artifact lifecycle management | Medium |

### Installing Skills for a Host

```bash
# Install all skills for Claude Code
npx visual-browser-agent skill install all --host claude-code

# Install for Cursor
npx visual-browser-agent skill install all --host cursor

# List available skills
npx visual-browser-agent skill list
```

---

## Host Compatibility

Works with 12+ coding agents via MCP:

| Host | Integration | Subagent Wrapper |
|------|-------------|------------------|
| **Claude Code** | MCP + skills + hooks | ✅ `.claude/agents/visual-browser-specialist.md` |
| **Google Antigravity** | MCP + permissions + skills | ✅ |
| **Cursor** | MCP + skills + subagents | ✅ `.cursor/agents/visual-browser-specialist.md` |
| **Windsurf / Devin Desktop** | MCP (stdio + HTTP) | — |
| **Cline** | MCP + auto-approve | — |
| **Roo Code** | MCP + custom modes | — |
| **Kiro** | MCP + skills + hooks | — |
| **GitHub Copilot** | MCP + custom agents | — |
| **OpenAI Codex CLI** | MCP + approval modes | — |
| **Gemini CLI** | MCP + extensions + skills | ✅ `.gemini/agents/visual-browser-specialist.md` |
| **OpenCode** | MCP + skills | — |
| **Goose** | MCP + skills + recipes | — |

### Generating Host Config

```bash
# Generate MCP config + permission templates + subagent wrapper
npx visual-browser-agent host install claude-code
npx visual-browser-agent host install cursor
npx visual-browser-agent host install gemini
```

---

## Configuration

Created at `visual-browser-agent.yaml`:

```yaml
browser:
  mode: extension  # extension | managed | cdp
  allowedHosts: []
  approvedDirectories:
    screenshots: ./runs/screenshots
    recordings: ./runs/recordings
    downloads: ./runs/downloads
    uploads: ./runs/uploads

observation:
  screenshotOnNavigation: true
  screenshotOnStateChange: true
  recordAnimations: on-demand
  rollingBufferSeconds: 5
  clipAfterTriggerSeconds: 8
  deduplicateFrames: true

human:
  requireFor: [password, otp, captcha, account_switch, public_post, message_send, purchase, deletion]
  allowTakeover: true
  requireResumeButton: true

retention:
  rawVideoDays: 3
  screenshotsDays: 14
  reportsDays: 90
  maxRunSizeMb: 500
  deleteExpiredAutomatically: true

safety:
  blockPublicSubmissionByDefault: true
  blockUnrestrictedCdp: true
  redactSecretsFromLogs: true
  restrictFilesystemToApprovedDirectories: true
```

---

## Architecture

```
visual-browser-agent/
├── bin/visual-browser-agent.js         # CLI entry point
├── src/
│   ├── cli/                            # Commands: init, doctor, mcp, skill, host, agent
│   │   ├── index.ts                    # Commander program
│   │   └── host-manager.ts             # Host-specific installers
│   ├── adapter/                        # BrowserAdapter (Playwright + CDP)
│   │   ├── browser-adapter.ts          # Core browser control
│   │   └── types.ts                    # Browser types
│   ├── mcp/                            # MCP Server (18 tools, stdio + HTTP)
│   │   └── server.ts                   # Tool handlers + workflow functions
│   ├── config/                         # YAML config + schema
│   │   ├── schema.ts                   # VisualBrowserConfig types + defaults
│   │   └── index.ts                    # ConfigManager
│   ├── events/                         # Typed event bus for run orchestration
│   │   ├── types.ts                    # 19 event types (run.started → run.failed)
│   │   └── bus.ts                      # TypedEventBus with on/off/emit/once
│   ├── approval/                       # Risk-based tool approval gates
│   │   ├── types.ts                    # ApprovalRequest, ApprovalPolicy
│   │   └── service.ts                  # ApprovalService with auto-approve logic
│   ├── subagent/                       # Subagent scheduling framework
│   │   ├── types.ts                    # SubagentTask, SubagentResult, DelegationPlan
│   │   └── scheduler.ts               # SubagentScheduler with dependency resolution
│   ├── specialist/                     # Specialist agent runtime
│   │   ├── types.ts                    # 12 specialist modes, delegation contract
│   │   ├── planner.ts                  # Deterministic planner per mode
│   │   └── runtime.ts                  # SpecialistRuntime.execute()
│   ├── video/                          # FFmpeg video analysis pipeline
│   │   ├── types.ts                    # VideoMetadata, FrameData, VideoManifest
│   │   └── analyzer.ts                 # VideoAnalyzer (ffprobe/ffmpeg)
│   ├── artifacts/                      # Artifact versioning and history
│   │   ├── types.ts                    # Artifact, ArtifactVersion
│   │   └── registry.ts                 # ArtifactRegistry with UUID + versioning
│   ├── retention/                      # Artifact lifecycle management
│   │   └── manager.ts                  # RetentionManager with TTL + size limits
│   ├── skills/                         # SkillManager (install/uninstall/list)
│   │   └── manager.ts                  # Portable Agent Skills installer
│   └── index.ts                        # Package exports
├── skills/                             # 18 portable Agent Skills (SKILL.md each)
│   ├── browser-navigation/
│   ├── website-study/
│   ├── design-inspiration-study/
│   ├── animation-study/
│   ├── responsive-audit/
│   ├── visual-regression/
│   ├── accessibility-review/
│   ├── visual-debugging/
│   ├── research-and-source-capture/
│   ├── public-business-lead-research/
│   ├── social-draft-and-approval/
│   ├── workflow-observation/
│   ├── video-evidence-review/
│   ├── artifact-retention/
│   ├── human-handoff/
│   ├── evidence-review/
│   ├── visual-capture/
│   └── retention-cleanup/
├── wrappers/                           # Host-specific subagent wrappers
│   ├── claude-code/visual-browser-specialist.md
│   ├── cursor/visual-browser-specialist.md
│   └── gemini/visual-browser-specialist.md
├── package.json
├── tsconfig.json
└── README.md
```

---

## Use Cases

### Website Research & Inspiration
> "Study Stripe's checkout flow. Document the visual hierarchy, typography, color relationships, and interaction patterns. Return an evidence-backed inspiration brief."

### UI Quality Assurance
> "Run visual QA on our pricing page. Test desktop (1280px), tablet (768px), and mobile (375px). Capture screenshots at each breakpoint. Report any layout issues."

### Animation & Motion Study
> "Analyze the hero section animation on this landing page. Record the entrance animation. Check easing, duration, and whether it respects prefers-reduced-motion."

### Responsive Audit
> "Audit our marketing site for responsive issues. Check navigation, content reflow, touch targets, and readability at all breakpoints."

### Accessibility Review
> "Run an accessibility visual review. Check focus indicators, contrast ratios, heading hierarchy, and form labels. Combine structured a11y tree data with screenshots."

### Visual Debugging
> "The mobile menu is cut off on iPhone. Reproduce the issue, capture evidence, analyze the CSS, and report the root cause."

### Workflow Observation
> "Observe this checkout workflow without submitting anything. Record each step. Create a step-by-step map and identify confusing stages."

### Business Research
> "Collect public company information from these competitor websites. Extract pricing, features, and positioning. Return structured records with source URLs."

---

## Safety

- **No arbitrary code execution** — the product does not expose a general-purpose code runner
- **Approved directories only** — filesystem access restricted to configured paths
- **Blocked public submissions by default** — posts, purchases, and deletions require explicit approval
- **Unrestricted CDP blocked** — must use managed or extension mode
- **Secrets redacted from logs** — no credentials in browser output
- **Human approval required** for: login, 2FA, CAPTCHA, OAuth, payment, public posts, purchases, deletions
- **Evidence-based decisions** — structured DOM first, visual evidence only when it changes the decision

---

## Definition of Done

The product is ready for beta when a user can run:

```bash
npx visual-browser-agent init
```

Then ask their agent:

> "Study this website's visual design and interactions. Check desktop and mobile layouts. Record only important animations. Review the selected frames and clips yourself, then explain which patterns are useful inspiration and which responsive or accessibility issues you found. Ask me only if authentication, a sensitive action, or an unresolved decision is required."

The system must then:
1. Inspect structured page state
2. Navigate and interact within approved scope
3. Select screenshots or clips only when useful
4. Analyze recordings in chunks with motion/scene signals
5. Connect evidence to actions and findings
6. Continue or retry based on visual review
7. Pause for human input only when necessary
8. Retain useful artifacts and delete temporary data
9. Produce a report with source URLs, timestamps, evidence paths, findings, confidence, and limitations

---

## License

MIT
