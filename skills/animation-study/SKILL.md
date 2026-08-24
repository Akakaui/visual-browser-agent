---
name: animation-study
description: Study and record animations, transitions, and motion behavior on web pages. Capture timing, easing, and visual quality.
version: 0.1.0
triggers:
  - "animation"
  - "transition"
  - "motion"
  - "micro-interaction"
  - "animate"
requiredTools:
  - navigate
  - inspect_page
  - record_interaction
  - capture_screenshot
  - review_visual_evidence
  - animation_study (workflow tool)
dataScope: "active_tab_only"
risk: low
---

# Animation Study Skill

## When to Use
Use this skill to analyze web animations:
- CSS transitions/animations
- JavaScript-driven animations
- Scroll-triggered animations
- Page transitions
- Micro-interactions (hover, focus, click)
- Loading states
- Parallax effects

## Instructions

### Detection
1. `inspect_page` to find animated elements (check for `transition`, `animation` CSS properties)
2. Look for: `@keyframes`, `transition`, `animation`, `transform`, `opacity` changes
3. Check for libraries: Framer Motion, GSAP, Lottie, CSS-in-JS

### Triggering Animations
Common triggers:
- **Hover**: `page.hover(selector)`
- **Click**: `click(selector)`
- **Focus**: `page.focus(selector)`
- **Scroll**: `page.evaluate(() => window.scrollTo(0, 500))`
- **Load**: Already captured on navigation
- **Custom**: Execute trigger actions from config

### Recording
1. `record_interaction(action: "start", requirement: "capture {animation}")`
2. Trigger animation
3. Wait for duration + buffer (use `clipAfterTriggerSeconds: 8`)
4. `record_interaction(action: "stop")`

### Analysis
For each recording:
1. `review_visual_evidence` with requirement: "analyze animation quality"
2. Extract: duration, easing, keyframes, performance
3. Check: 60fps, jank, layout thrashing, `will-change` usage

### Key Metrics
- **Duration**: Total animation time
- **Easing**: Timing function (cubic-bezier, steps, etc.)
- **Properties**: What changes (transform, opacity, width, height, etc.)
- **Performance**: Frame drops, main thread blocking
- **Accessibility**: `prefers-reduced-motion` support

## Output
```json
{
  "animations": [
    {
      "selector": ".button",
      "trigger": "hover",
      "duration": "200ms",
      "easing": "cubic-bezier(0.4, 0, 0.2, 1)",
      "properties": ["transform", "box-shadow"],
      "performance": "smooth",
      "reducedMotion": "supported",
      "evidence": "clips/button-hover.webm"
    }
  ]
}
```

## Safety
- Only record on current page
- Limit recording duration (max 30 seconds per animation)
- Don't trigger infinite animations
- Respect `prefers-reduced-motion`

## Examples
```
User: "Analyze the hero animation on this landing page"
Agent:
1. navigate(url)
2. inspect_page() → find hero element
3. record_interaction(start, "hero entrance animation")
4. [animation plays on load]
5. record_interaction(stop)
6. review_visual_evidence(recording, "analyze hero animation quality")
```

```
User: "Check all micro-interactions on this page"
Agent:
1. inspect_page() → find interactive elements
2. For each: hover → record → click → record → focus → record
3. Compile micro-interaction inventory
```