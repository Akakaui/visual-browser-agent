---
name: human-handoff
description: Handle human-in-the-loop workflows for authentication, CAPTCHA, 2FA, sensitive actions, and ambiguous situations.
version: 0.1.0
triggers:
  - "login"
  - "sign in"
  - "authenticate"
  - "captcha"
  - "2fa"
  - "two factor"
  - "verify"
  - "approval"
  - "confirm"
  - "sensitive"
requiredTools:
  - ask_human
  - request_approval
  - open_takeover_view
  - capture_screenshot
dataScope: "active_tab_only"
risk: high
---

# Human Handoff Skill

## When to Use
Use this skill when the agent encounters situations requiring human intervention:
- Login/authentication flows
- CAPTCHA challenges
- Two-factor authentication (2FA)
- OAuth consent screens
- Payment flows
- Account settings changes
- Public submissions (posts, messages, purchases)
- Destructive actions (deletion, irreversible changes)
- Unresolved ambiguity after evidence review

## Instructions

### Authentication Flows
1. Detect login page via `inspect_page` (look for password fields, OAuth buttons)
2. Call `ask_human` with `sensitive: true` and form schema for credentials
3. Use `request_approval` for OAuth consent
4. Wait for human to complete in browser takeover view
5. Resume with `navigate` or `inspect_page` to verify success

### CAPTCHA/2FA
1. Detect challenge via page inspection
2. Call `ask_human` with `sensitive: true`, screenshot, and clear instructions
3. Provide `open_takeover_view` for direct browser access
4. Wait for `resume` signal

### Sensitive Actions
1. Before any public submission, purchase, or deletion:
   - Call `request_approval` with action details
   - Show screenshot of current state
   - Wait for explicit approval
2. Use `submit_public_action` only after approval
3. Capture evidence before and after

### Ambiguity Resolution
1. When evidence review yields low confidence:
   - Call `ask_human` with options
   - Provide relevant screenshots/clips
   - Let human decide next step

## Decision Flow
```
Page requires auth?
  → ask_human (sensitive: true) → human completes → resume
  
Page has CAPTCHA/2FA?
  → ask_human (sensitive: true) + open_takeover_view → human completes → resume
  
Action is public submission/purchase/deletion?
  → request_approval → if approved → submit_public_action
  
Evidence review confidence < 0.7?
  → ask_human with options → human decides → continue
```

## Safety
- NEVER request passwords/tokens via form mode (use URL mode / browser takeover)
- Always capture screenshot before and after sensitive actions
- Log all human interactions for audit
- Respect `human.requireFor` config list
- Require `human.requireResumeButton` for takeover flows

## Examples
```
User: "Login to GitHub and check my notifications"
Agent:
1. navigate(url: "https://github.com/login")
2. inspect_page() → detects password field
3. ask_human(runId, "GitHub login required. Complete in browser, then press Resume.", sensitive: true)
4. [Human logs in via takeover view]
4. request_approval(runId, "Access notifications", "Reading private notifications")
5. navigate(url: "https://github.com/notifications")
6. inspect_page() → capture results
```

```
User: "Post this tweet"
Agent:
1. navigate(url: "https://twitter.com/compose/tweet")
2. fill(selector: "[data-testid=tweetTextarea]", value: "...")
3. request_approval(runId, "Post tweet", "Public submission to Twitter")
4. if approved: submit_public_action(runId, "post", "twitter.com", {text: "..."})
5. capture_screenshot(action: "tweet posted")
```