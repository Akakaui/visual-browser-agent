---
name: website-study
description: Study a public website's rendered design, interactions, responsiveness, and motion using structured inspection and selective screenshots or recordings. Use for design inspiration, UX study, or visual analysis.
version: 0.1.0
triggers:
  - "study website"
  - "analyze website"
  - "design review"
  - "ux audit"
  - "competitor analysis"
  - "visual analysis"
requiredTools:
  - navigate
  - inspect_page
  - capture_screenshot
  - record_interaction
  - review_visual_evidence
  - study_website (workflow tool)
dataScope: "public_websites_only"
risk: medium
---

# Website Study Skill

## When to Use
Use this skill when the user wants to analyze a public website's:
- Visual design (typography, colors, spacing, layout)
- Interactions (hover states, clicks, transitions)
- Responsiveness (breakpoints, mobile/desktop)
- Motion/animations
- Information architecture
- Accessibility

## Instructions

### Phase 1: Planning
1. Clarify scope: Which pages? Which viewports? What aspects matter most?
2. Create run context with `createRunContext(goal, requirements)`
3. Define viewports (default: desktop 1280x720, tablet 768x1024, mobile 375x667)

### Phase 2: Structured Inspection
For each page and viewport:
1. `navigate(url, waitUntil: "networkidle")`
2. `inspect_page(includeA11y: true, includeDOM: false)` - get accessibility tree
3. `capture_screenshot(action: "viewport-{name}", requirement: "{name} layout")`
3. Extract: colors, fonts, spacing, component inventory

### Phase 3: Interaction Study
For key interactive elements:
1. Identify interactive elements from accessibility tree
3. For each: hover, click, focus states
4. `record_interaction` for transitions/animations
5. `capture_screenshot` for each state

### Phase 4: Responsive Audit
Use `responsive_audit` workflow tool or manual:
1. Test each viewport breakpoint
2. Check: navigation, content reflow, touch targets, readability
3. Document issues with screenshots

### Phase 5: Animation Study
Use `animation_study` workflow tool or manual:
1. Identify animated elements
2. Trigger animations (hover, click, scroll, load)
3. `record_interaction` with 8-second clips
4. Analyze: easing, duration, purpose, performance

### Phase 6: Vision Review
For each captured artifact:
1. `review_visual_evidence(artifacts, requirement, context)`
2. Document findings, confidence, pass/fail
3. Build evidence manifest

### Phase 7: Synthesis
1. Compile findings into structured report
2. Include: design system analysis, interaction patterns, responsive issues, animation quality
3. Reference all evidence with event IDs
4. Save as artifact (Markdown/HTML)

## Output Format
```markdown
# Website Study: {domain}

## Design System
- Colors: {palette}
- Typography: {fonts, scale}
- Spacing: {system}
- Components: {inventory}

## Interactions
- Navigation: {patterns}
- Forms: {patterns}
- Feedback: {toasts, modals, etc.}

## Responsiveness
- Breakpoints: {tested}
- Issues: [{viewport, issue, evidence}]

## Motion
- Animations: [{element, trigger, duration, easing, quality}]
- Performance: {notes}

## Accessibility
- Score: {pass/fail}
- Issues: [{element, issue, wcag}]

## Evidence
- {eventId}: {description} → {artifacts}
```

## Safety
- Only study PUBLIC websites
- Respect robots.txt and ToS
- Never capture private/authenticated content without explicit permission
- Don't copy assets, code, or proprietary designs
- Limit to `maxPages` (default 3) per study
- Rate limit: 1 request/second minimum

## Examples
```
User: "Study Stripe's checkout flow design"
Agent:
1. createRunContext("Study Stripe checkout", ["visual design", "interactions", "responsiveness", "motion"])
2. study_website(url: "https://stripe.com/checkout", viewports: [desktop, mobile], captureAnimations: true)
3. Review evidence, synthesize report
4. Save artifact
```

```
User: "Compare our pricing page to 3 competitors"
Agent:
1. For each competitor: study_website with same viewports
2. Create comparison matrix
3. Highlight differentiators with evidence
```