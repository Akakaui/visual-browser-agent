---
name: visual-debugging
description: Debug visual issues by capturing evidence, comparing states, and analyzing rendering problems.
version: 0.1.0
triggers:
  - "debug"
  - "visual bug"
  - "layout issue"
  - "rendering problem"
  - "css issue"
  - "compare"
requiredTools:
  - navigate
  - inspect_page
  - capture_screenshot
  - record_interaction
  - review_visual_evidence
dataScope: "active_tab_only"
risk: low
---

# Visual Debugging Skill

## When to Use
Use this skill to debug visual issues:
- Layout breaks (overflow, overlap, misalignment)
- Rendering differences across browsers/viewports
- CSS specificity/conflict issues
- Z-index problems
- Flexbox/Grid layout bugs
- Image loading/aspect ratio issues
- Font rendering problems
- Animation glitches

## Instructions

### Reproduction
1. `navigate` to problematic page/state
2. `inspect_page` to get DOM/CSS context
3. `capture_screenshot` of issue
4. If intermittent: `record_interaction` to capture occurrence

### Comparison
For cross-browser/viewport issues:
1. Test in each target environment
2. Capture same view in each
3. Use `review_visual_evidence` with multiple artifacts
4. Document differences

### State Comparison
For before/after or interaction-triggered bugs:
1. Capture "before" state
2. Trigger interaction
3. Capture "after" state
4. Compare via vision review

### CSS Analysis
From `inspect_page` accessibility tree + DOM:
1. Identify problematic element
2. Extract computed styles (via CDP if needed)
3. Check: box model, flex/grid properties, positioning, z-index

### Console/Network Correlation
1. Check console errors during reproduction
2. Check network for failed resources (fonts, images, CSS)
3. Correlate with visual symptoms

## Debugging Workflow
```
1. Reproduce → capture evidence
2. Isolate → minimal test case
3. Hypothesize → check CSS/DOM
4. Verify → fix attempt → recapture
5. Confirm → document
```

## Output
```markdown
# Visual Debug Report: {issue}

## Environment
- URL: {url}
- Viewport: {viewport}
- Browser: {browser}
- Steps to reproduce: {steps}

## Evidence
- Before: {screenshot}
- After: {screenshot}
- Recording: {clip}

## Analysis
- Root cause: {CSS/JS/Asset/Environment}
- Affected elements: {selectors}
- Computed styles: {key properties}

## Fix Recommendation
{code snippet or description}

## Verification
- Fixed in: {environments}
- Evidence: {post-fix screenshots}
```

## Safety
- Don't modify page state destructively
- Only capture, don't inject code (unless explicitly allowed)
- Respect private/authenticated pages

## Examples
```
User: "The mobile menu is cut off on iPhone"
Agent:
1. navigate(url)
2. Set viewport to 375x667
3. click(selector: ".menu-toggle")
4. capture_screenshot(action: "mobile_menu_bug", requirement: "menu fully visible")
5. inspect_page(selector: ".menu-panel") → check styles
6. review_visual_evidence(...)
7. Document: "menu-panel max-height too small for content"
```