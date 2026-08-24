---
name: research-and-source-capture
description: Collect documentation, code examples, diagrams, and release notes from public websites into an organized, searchable evidence library with full source attribution.
version: 0.1.0
triggers:
  - "research"
  - "collect sources"
  - "evidence library"
  - "save documentation"
  - "release notes"
requiredTools:
  - navigate
  - inspect_page
  - capture_screenshot
  - download_file
dataScope: "public_websites_only"
risk: low
---

# Research and Source Capture Skill

## When to Use
Use this skill to build an evidence library from public web research:
- Documentation pages and API references
- Code examples and configuration snippets
- Diagrams, charts, and architecture figures
- Release notes and changelogs
- Any task needing verifiable, attributable sources

## Instructions

### Collection Workflow
1. `navigate(url)` to each source page
2. `inspect_page()` to extract headings, body text, and code blocks
3. Write extracted content to the evidence library as markdown/plain text
4. `download_file(url)` for binary assets (images, PDFs, archives)
5. Record source URL + timestamp for EVERY captured item

### Evidence Library Layout
Organize by topic so the library stays searchable:
```
evidence-library/
  <topic>/
    index.json      # searchable metadata for every item
    docs/           # extracted markdown/text/code
    assets/         # downloaded diagrams, PDFs, images
    screenshots/    # only when visuals matter
```

### Item Metadata
Every entry in `index.json` must include:
- `sourceUrl` - canonical URL of the page
- `capturedAt` - ISO 8601 timestamp of capture
- `title` and `itemType` (doc | code | diagram | release-note)
- `filePath` - local path where the content was saved

### Screenshot Policy
Capture screenshots ONLY when they add information beyond the text:
- Good: visual layouts, rendered diagrams, UI states, charts
- Avoid: plain prose or code blocks (extract text instead)
- Use descriptive names: `<topic>-<slug>-<sequence>.png`

### Searchability Rules
- Keep `index.json` keys stable across topics for easy aggregation
- Prefer extracted text over images so content stays grep-able
- Never silently overwrite an item - append a new versioned entry

## Output
```json
{
  "topic": "auth-patterns",
  "items": [
    {
      "sourceUrl": "https://example.com/docs/oauth",
      "capturedAt": "2026-08-23T10:15:00Z",
      "title": "OAuth 2.0 flow overview",
      "itemType": "doc",
      "filePath": "evidence-library/auth-patterns/docs/oauth-overview.md",
      "screenshot": null
    }
  ]
}
```

## Safety
- Publicly accessible pages only - no login walls or paywall bypass
- Respect robots.txt and site terms of service
- No orphan captures: every item carries source URL + timestamp
- Keep personal data out of the library unless publicly published business info

## Examples
```
User: "Collect the v3 release notes from their docs site"
Agent:
1. navigate(releases page) → inspect_page() → extract v3 notes as markdown
2. Save to evidence-library/example-releases/docs/v3-notes.md
3. Append index.json entry with sourceUrl + capturedAt
```

```
User: "Research pagination patterns across 5 design systems"
Agent:
1. For each system: navigate → inspect_page
2. Extract code examples to docs/, download diagrams to assets/
3. Screenshot only rendered component demos
4. Build one index.json per system under evidence-library/pagination/
```
