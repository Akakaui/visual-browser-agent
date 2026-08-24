---
name: visual-regression
description: Capture baseline screenshots per viewport and route, re-run after changes, compare using pixel/perceptual diff concepts, and report failures with viewport, route, actions, evidence, and confidence.
version: 0.1.0
triggers:
  - "visual regression"
  - "screenshot diff"
  - "pixel diff"
  - "baseline compare"
  - "did the ui change"
requiredTools:
  - navigate
  - capture_screenshot
  - inspect_page
  - review_visual_evidence
dataScope: "active_tab_only"
risk: low
---

# Visual Regression Skill

## When to Use
Use this skill to detect unintended visual changes:
- After CSS/style refactors
- After dependency or framework upgrades
- Before releases ("did anything shift?")
- Verifying a fix did not break unrelated screens
- Auditing a route matrix across viewports

## Instructions

### Baseline Capture
1. Define the matrix: routes x viewports (desktop 1280x720, tablet 768x1024, mobile 375x667)
2. For each cell: `navigate(route)`, wait for stability (network idle + fonts loaded), `capture_screenshot`
3. Name deterministically: `{route}-{viewport}-baseline`; record the action sequence that produced the state (e.g., `["navigate /cart", "click .promo-accordion"]`)
4. Store baselines with route, viewport, timestamp, and action-sequence metadata

### Re-run After Changes
1. Repeat the exact matrix with identical viewports, wait conditions, and action sequences
2. Name candidates with a run ID: `{route}-{viewport}-{runId}`
3. Any drift between runs (viewport size, wait timing, animations mid-flight) invalidates the comparison

### Comparing
Two complementary concepts:
- **Pixel diff**: strict per-pixel inequality; catches everything but is noisy around text antialiasing and subpixel rendering
- **Perceptual diff**: similarity metrics tolerant of imperceptible rendering variance; fewer false positives on real changes

Pick one strategy per project, set explicit thresholds, and document them next to the baselines.

### Reporting Failures
Every reported failure must include:
- Viewport + route
- Full action sequence reproducing the state at capture time
- Side-by-side evidence: baseline, candidate, highlighted diff overlay
- Confidence score plus a judgment on whether the changed region is meaningful (content/layout) or incidental (decoration)

## Baseline Management
- Version-control baselines alongside intentional design changes
- Update baselines deliberately, one change at a time - never wholesale re-baselining to make diffs green
- Quarantine flaky regions (ads, timestamps, avatars) with masks or an exclusion list
- Re-baseline after browser or display-scale upgrades, noting it as a run-environment event

## Safety
- Read-only against the app under test
- Identical conditions across runs, or the result must be marked invalid
- Never silently drop low-confidence diffs - surface them for human review

## Examples
```
User: "Check if the settings page still renders right after the CSS refactor"
Agent:
1. Load baseline matrix for /settings x [desktop, mobile]
2. navigate -> settle -> capture_screenshot candidate shots
3. Pixel + perceptual diff vs baselines
4. Report: mobile /settings fails (header spacing), confidence 0.93, evidence attached
```

```
User: "Set up regression checks for our three main routes"
Agent:
1. Capture baseline screenshots for all routes x viewports
2. Record action sequences and metadata per cell
3. Commit baselines with documentation of thresholds
4. Provide re-run procedure for future changes
```
