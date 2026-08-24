---
name: accessibility-review
description: Audit the current page for accessibility issues by combining structured accessibility-tree checks with screenshot-required visual checks, producing WCAG-referenced findings.
version: 0.1.0
triggers:
  - "accessibility"
  - "a11y"
  - "wcag"
  - "screen reader labels"
  - "focus visibility"
requiredTools:
  - inspect_page
  - capture_screenshot
  - review_visual_evidence
dataScope: "active_tab_only"
risk: low
---

# Accessibility Review Skill

## When to Use
Use this skill to audit accessibility of the current page:
- Missing accessible names on interactive elements
- Broken or skipped heading hierarchy
- Unlabeled form controls
- Contrast, focus visibility, clipping, or overflow problems
- Pre-merge a11y spot checks or full page audits

## Instructions

### Tree Checks (via inspect_page)
Inspect the structured accessibility tree for:
1. **Missing accessible names**: icon-only buttons, image links, links whose text is only an icon glyph
2. **Heading hierarchy**: skipped levels (h2 -> h4), multiple h1s, headings used purely for visual styling
3. **Unlabeled controls**: inputs without label text, `aria-label`, or `aria-labelledby`; placeholders doing a label's job
4. **Landmarks and roles**: missing main/nav landmarks, incorrect ARIA roles, duplicate IDs referenced by labels

### Screenshot Checks (capture_screenshot + review_visual_evidence)
Some failures only exist visually - screenshots are required:
1. **Contrast**: text vs background ratios; flag below 4.5:1 normal text, 3:1 large text
2. **Focus visibility**: tab through interactive elements and screenshot each focused state; flag invisible indicators
3. **Clipping**: truncated or cut-off text at common viewports
4. **Overflow**: content escaping containers, horizontal scroll traps, overlapping hit targets

### Combining Evidence into Findings
Each finding pairs both evidence types where possible:
- Element selector/name from the tree + artifact ID of the supporting screenshot
- Format: `{element, issue, wcag, severity, confidence, evidence[]}`
- Tree-only findings still get a context screenshot when feasible

### WCAG References
| Issue | WCAG 2.x Success Criterion |
| --- | --- |
| Missing accessible name | 4.1.2 Name, Role, Value |
| Heading hierarchy broken | 1.3.1 Info and Relationships |
| Unlabeled input | 3.3.2 Labels or Instructions |
| Low contrast | 1.4.3 Contrast (Minimum) |
| Invisible focus indicator | 2.4.7 Focus Visible |

## Safety
- Read-only audit: never patch DOM or styles mid-review to "fix" what you find
- Keyboard traversal may open dialogs or menus; close them via Escape and note the behavior
- Report findings; suggest remediation but do not apply it unasked
- Flag uncertain contrast readings (gradients, images behind text) as needing manual verification

## Examples
```
User: "Quick a11y pass on this checkout page"
Agent:
1. inspect_page() -> tree checks: names, headings, labels
2. Tab through form -> capture_screenshot each focus state
3. review_visual_evidence() -> contrast and clipping analysis
4. Findings list: element, WCAG ref, severity, confidence, evidence IDs
```

```
User: "Why do screen readers skip our promo banner?"
Agent:
1. inspect_page(includeA11y: true) -> banner subtree inspection
2. Found: decorative heading misused as landmark boundary
3. capture_screenshot for context
4. Report: WCAG 1.3.1 finding with both evidence types attached
```
