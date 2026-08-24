---
name: visual-capture
description: Capture screenshots, recordings, and visual evidence with automatic triggers and manual control.
version: 0.1.0
triggers:
  - "screenshot"
  - "screen capture"
  - "record"
  - "recording"
  - "video"
  - "capture"
  - "visual evidence"
requiredTools:
  - capture_screenshot
  - record_interaction
  - inspect_page
dataScope: "active_tab_only"
risk: low
---

# Visual Capture Skill

## When to Use
Use this skill for capturing visual evidence:
- Screenshots of page states
- Short video recordings of interactions
- Animation/transition capture
- Before/after comparisons
- Visual regression evidence

## Instructions

### Automatic Triggers (Config-Driven)
The system automatically captures based on config:
- `screenshotOnNavigation`: After every navigation
- `screenshotOnStateChange`: After clicks, fills, navigation
- `recordAnimations`: "on-demand" (default) / "always" / "never"

### Manual Capture
1. **Screenshots**: Use `capture_screenshot` with:
   - `action`: Descriptive action name
   - `requirement`: What this screenshot proves
   - `selector`: Optional element to capture
   - `fullPage`: Capture full scrollable page

2. **Recordings**: Use `record_interaction`:
   - `action: "start"` + `requirement` to begin
   - Perform interactions
   - `action: "stop"` to end and save

### Rolling Buffer
- Config: `rollingBufferSeconds: 5`, `clipAfterTriggerSeconds: 8`
- Continuously records last 5 seconds
- On trigger, saves 8-second clip (5 before + 3 after)
- Enable with `recordAnimations: "always"`

### Frame Deduplication
- Config: `deduplicateFrames: true`
- Compares consecutive frames
- Skips near-identical screenshots
- Reduces storage for static pages

## Evidence Manifest
Every capture creates an evidence manifest:
```json
{
  "eventId": "event-042",
  "action": "open_mobile_menu",
  "requirement": "mobile navigation is usable",
  "artifacts": ["frames/mobile-menu-open.png", "clips/mobile-menu.webm"],
  "review": { "passed": true, "confidence": 0.94, "findings": [] },
  "nextDecision": "continue"
}
```

## Best Practices
- Always include `requirement` - what question does this evidence answer?
- Use descriptive `action` names for traceability
- Capture minimally - only what's needed for the requirement
- Review evidence before deciding next action
- Use `review_visual_evidence` for vision-based analysis

## Examples
```
User: "Capture the mobile menu open state"
Agent:
1. click(selector: ".mobile-menu-button")
2. capture_screenshot(action: "mobile_menu_open", requirement: "mobile navigation is usable")
3. review_visual_evidence(artifacts: [...], requirement: "mobile navigation is usable")
```

```
User: "Record the button hover animation"
Agent:
1. record_interaction(action: "start", requirement: "button hover animation")
2. hover(selector: ".cta-button")
3. wait(500ms)
4. record_interaction(action: "stop")
```