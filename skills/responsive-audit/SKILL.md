---
name: responsive-audit
description: Audit responsive behavior across viewports. Check layout, navigation, content reflow, touch targets, and readability.
version: 0.1.0
triggers:
  - "responsive"
  - "mobile"
  - "tablet"
  - "breakpoint"
  - "viewport"
  - "responsive audit"
requiredTools:
  - navigate
  - inspect_page
  - capture_screenshot
  - responsive_audit (workflow tool)
dataScope: "active_tab_only"
risk: low
---

# Responsive Audit Skill

## When to Use
Use this skill to verify responsive design:
- Layout at different breakpoints
- Navigation adaptation (hamburger menu, etc.)
- Content reflow and readability
- Touch target sizes (min 44x44px)
- Image scaling and art direction
- Font scaling and line length
- Horizontal scrolling issues

## Instructions

### Standard Viewports
Test at minimum:
- **Desktop**: 1280x720, 1920x1080
- **Tablet**: 768x1024 (portrait), 1024x768 (landscape)
- **Mobile**: 375x667 (iPhone), 390x844 (modern), 412x915 (large)

### Audit Checklist Per Viewport

#### Navigation
- [ ] Menu accessible (hamburger on mobile)
- [ ] Touch targets ≥ 44x44px
- [ ] Logo/brand visible
- [ ] Search accessible

#### Content
- [ ] No horizontal scroll
- [ ] Text readable (min 16px, line length 45-75ch)
- [ ] Images scale properly
- [ ] Tables handle overflow (scroll/cards)
- [ ] Forms usable (inputs sized, labels visible)

#### Layout
- [ ] Grid/flex reflows correctly
- [ ] No overlapping elements
- [ ] Whitespace appropriate
- [ ] Footer accessible

#### Performance
- [ ] Images appropriately sized (srcset)
- [ ] No layout shift (CLS)
- [ ] Fonts loaded (FOIT/FOUT handled)

### Evidence Capture
For each viewport:
1. `navigate(url, waitUntil: "networkidle")`
2. `capture_screenshot(action: "responsive-{viewport}", requirement: "{viewport} layout")`
3. `inspect_page(includeA11y: true)` - check touch targets, labels

### Issue Documentation
```json
{
  "viewport": "mobile-375",
  "issue": "Navigation menu overlaps content",
  "severity": "high",
  "evidence": "frames/responsive-mobile-375.png",
  "wcag": "1.4.10 Reflow"
}
```

## Output
```markdown
# Responsive Audit: {url}

## Viewports Tested
- Desktop (1280x720) ✓
- Tablet (768x1024) ✓
- Mobile (375x667) ⚠ Issues found

## Issues
| Viewport | Component | Issue | Severity | Evidence |
|----------|-----------|-------|----------|----------|
| Mobile | Nav | Hamburger menu doesn't close on link click | High | event-012 |
| Tablet | Hero | Text too small (14px) | Medium | event-015 |

## Pass Rate: 85%
```

## Safety
- Only test public URLs or explicitly authorized pages
- Don't interact with forms that submit data
- Limit to configured viewports

## Examples
```
User: "Audit our pricing page responsiveness"
Agent:
1. responsive_audit(url: "https://oursite.com/pricing", viewports: [desktop, tablet, mobile])
2. Review screenshots for each breakpoint
3. Document issues with evidence
4. Save report artifact
```