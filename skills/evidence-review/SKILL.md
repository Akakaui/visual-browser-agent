---
name: evidence-review
description: Review captured visual evidence (screenshots, recordings) against requirements using vision analysis. Determine pass/fail, confidence, and findings.
version: 0.1.0
triggers:
  - "review"
  - "analyze screenshot"
  - "check recording"
  - "verify visual"
  - "evidence review"
requiredTools:
  - review_visual_evidence
  - capture_screenshot
  - record_interaction
dataScope: "artifacts_only"
risk: low
---

# Evidence Review Skill

## When to Use
Use this skill to analyze visual evidence against requirements:
- Verify UI matches design specs
- Check accessibility compliance
- Validate responsive behavior
- Confirm animation quality
- Assess visual regression
- Make go/no-go decisions

## Instructions

### Review Process
For each evidence review request:
1. Receive: `artifactPaths[]`, `requirement`, `context`
2. Call `review_visual_evidence` with all three
3. Get structured response: `passed`, `confidence`, `findings[]`
4. Create evidence manifest with `nextDecision`

### Vision Analysis Capabilities
The reviewer can assess:
- **Layout**: Alignment, spacing, grid adherence
- **Typography**: Font family, size, weight, line height, color
- **Color**: Palette match, contrast ratios, semantic usage
- **Components**: Presence, state, variants
- **Interactions**: Hover/focus/active states visible
- **Responsive**: Breakpoint behavior, content reflow
- **Motion**: Animation smoothness, duration, easing
- **Accessibility**: Focus indicators, contrast, labels
- **Content**: Text accuracy, image presence, truncation

### Confidence Scoring
- **0.9-1.0**: Clear pass/fail, unambiguous
- **0.7-0.89**: Likely correct, minor uncertainty
- **0.5-0.69**: Ambiguous, needs human review
- **<0.5**: Cannot determine, escalate

### Decision Mapping
| Confidence | Passed | Next Decision |
|------------|--------|---------------|
| ≥0.9 | true | continue |
| ≥0.9 | false | retry / human |
| 0.7-0.89 | true | continue |
| 0.7-0.89 | false | retry / human |
| <0.7 | any | human |

### Findings Format
```json
{
  "type": "layout" | "typography" | "color" | "interaction" | "accessibility" | "content" | "performance",
  "severity": "critical" | "major" | "minor" | "info",
  "element": "selector or description",
  "expected": "what should be",
  "actual": "what is",
  "wcag": "optional WCAG reference"
}
```

## Output: Evidence Manifest
```json
{
  "eventId": "event-042",
  "action": "review_checkout_button",
  "requirement": "Primary CTA meets WCAG AA contrast and 44px touch target",
  "artifacts": ["frames/checkout-cta.png"],
  "review": {
    "passed": false,
    "confidence": 0.92,
    "findings": [
      {
        "type": "accessibility",
        "severity": "major",
        "element": ".btn-primary",
        "expected": "4.5:1 contrast ratio",
        "actual": "3.2:1 contrast ratio",
        "wcag": "1.4.3 Contrast (Minimum)"
      },
      {
        "type": "interaction",
        "severity": "minor",
        "element": ".btn-primary",
        "expected": "≥44px touch target",
        "actual": "40px height"
      }
    ]
  },
  "nextDecision": "human"
}
```

## Integration
- Called automatically by `website-study`, `responsive-audit`, `animation-study`
- Can be invoked manually for custom reviews
- Feeds into run context for synthesis

## Safety
- Only reviews artifacts, doesn't capture new ones
- No external network calls
- No browser interaction

## Examples
```
User: "Check if the button contrast passes WCAG AA"
Agent:
1. capture_screenshot(action: "cta_contrast", requirement: "button contrast check")
2. review_visual_evidence(artifacts: [...], requirement: "Primary CTA meets WCAG AA contrast", context: "Checkout page primary button")
3. If confidence < 0.7 → ask_human
4. Document in evidence manifest
```