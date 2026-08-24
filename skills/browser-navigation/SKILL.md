---
name: browser-navigation
description: Core browser navigation and interaction skills. Use for basic navigation, clicking, filling forms, and page inspection.
version: 0.1.0
triggers:
  - "navigate to"
  - "go to"
  - "open url"
  - "click"
  - "fill"
  - "submit"
  - "inspect page"
requiredTools:
  - browser_connect
  - navigate
  - inspect_page
  - click
  - fill
  - capture_screenshot
dataScope: "active_tab_only"
risk: low
---

# Browser Navigation Skill

## When to Use
Use this skill for any task that requires basic browser navigation and interaction:
- Navigating to URLs
- Clicking elements
- Filling forms
- Basic page inspection
- Taking screenshots for documentation

## Instructions

### Navigation
1. Always use `browser_connect` first if not already connected
2. Use `navigate` with appropriate `waitUntil` (default: `domcontentloaded`)
3. After navigation, capture a screenshot if `observation.screenshotOnNavigation` is enabled
4. Use `inspect_page` to get structured page data

### Clicking
1. Use `inspect_page` first to find the correct selector
2. Use `click` with the selector
3. Wait for navigation or state change if needed
4. Capture screenshot if `observation.screenshotOnStateChange` is enabled

### Form Filling
1. Use `inspect_page` to find form field selectors
2. Use `fill` for each field
3. Use `click` for submit buttons
4. Handle any validation errors

### Page Inspection
1. Use `inspect_page` with `includeA11y: true` for accessibility tree
2. Use `includeDOM: true` only when needed (larger response)
3. Filter by `selector` to focus on specific elements

## Safety
- Only interact with elements on the current page
- Don't click elements that trigger downloads without explicit request
- Don't fill sensitive fields (passwords, payment) without human approval
- Respect `allowedHosts` in config

## Examples
```
User: "Go to example.com and click the first link"
Agent: 
1. browser_connect(mode: "extension")
2. navigate(url: "https://example.com")
3. inspect_page()
4. click(selector: "a:first-child")
5. capture_screenshot(action: "click first link")
```

```
User: "Fill the contact form with my info"
Agent:
1. inspect_page(selector: "form")
2. fill(selector: "#name", value: "John Doe")
3. fill(selector: "#email", value: "john@example.com")
4. fill(selector: "#message", value: "Hello")
5. click(selector: "button[type=submit]")
```