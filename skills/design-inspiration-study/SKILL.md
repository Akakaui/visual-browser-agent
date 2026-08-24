---
name: design-inspiration-study
description: Study public websites for layout hierarchy, typography, color, and spacing patterns, then produce an evidence-backed inspiration brief that distinguishes observation from implementation.
version: 0.1.0
triggers:
  - "design inspiration"
  - "layout patterns"
  - "typography study"
  - "color palette"
  - "spacing system"
  - "inspiration brief"
requiredTools:
  - navigate
  - inspect_page
  - capture_screenshot
  - study_website
  - review_visual_evidence
dataScope: "public_websites_only"
risk: medium
---

# Design Inspiration Study Skill

## When to Use
Use this skill when the user wants to learn from existing public designs:
- Layout hierarchy and grid structure
- Typography scales, pairings, and rhythm
- Color palettes and usage proportions
- Spacing systems and content density
- Building a mood board or inspiration brief for new work

## Instructions

### Study Pass
For each source site (limit to 3 per brief):
1. `navigate(url)` - public pages only
2. `inspect_page()` - extract computed styles: font families, size/weight/line-height scales, color tokens, spacing values, container widths
3. Map layout hierarchy: header/nav/hero/content/footer structure, column grid, vertical section rhythm
4. `capture_screenshot` per notable section at desktop (1280x720) and mobile (375x667) viewports

### Classify Every Finding
Apply this distinction to every item before it enters the brief:

> - **Observation** — what the site factually does ("hero heading pairs 64px display over 40px subhead on an 8pt grid")
> - **Inspiration** — why that pattern works and what it suggests when adapted to different content
> - **Implementation** — building an original equivalent from the extracted principle
> - **Copied asset** — reusing the site's actual image, code, or font file. Never permitted.

An observation becomes inspiration only with reasoning attached; it becomes implementation only as an original rebuild.

### Evidence Discipline
- Record the full source URL beside every observation and screenshot
- Note viewport and capture order for each artifact
- Run `review_visual_evidence` to confirm claims before they enter the brief
- Discard any finding you cannot back with captured evidence

### Inspiration Brief
Produce one document containing:
- Per-site pattern inventory (hierarchy, type scale, palette, spacing) with URLs
- Cross-site themes: patterns repeated across independent sources
- Adaptation notes written as principles, never as asset reuse
- Evidence manifest mapping every claim to a screenshot/event ID

## Safety
- Public websites only; respect robots.txt and ToS
- Never download or extract protected assets (images, fonts, video, source code)
- Never bypass paywalls, logins, rate limits, or other access controls
- Rate limit navigation: minimum 1 request/second between pages
- Cite every source; uncited claims must be removed from the brief

## Examples
```
User: "Gather pricing page layout ideas from competitors"
Agent:
1. navigate() to 3 public pricing pages (rate limited)
2. inspect_page() -> extract type scales, card grids, tier-emphasis patterns
3. capture_screenshot() each pricing table, both viewports
4. Classify findings (observation vs inspiration), attach source URLs
5. Compile evidence-backed inspiration brief
```

```
User: "Why does this landing page feel so calm?"
Agent:
1. inspect_page() -> measure spacing units, color count, line lengths
2. capture_screenshot() annotated sections
3. Brief chain: observation (facts) -> inspiration (principles) -> implementation (original spec)
4. No assets copied; every claim cites a URL and screenshot
```
