---
name: public-business-lead-research
description: Extract lawful public business fields from directories and company sites into normalized, deduplicated lead lists - with human approval required before any outreach.
version: 0.1.0
triggers:
  - "business leads"
  - "lead list"
  - "find businesses"
  - "directory research"
  - "prospect research"
requiredTools:
  - browser_connect
  - navigate
  - inspect_page
  - capture_screenshot
dataScope: "public_directories_only"
risk: medium
---

# Public Business Lead Research Skill

## When to Use
Use this skill to build lead lists from lawful public sources:
- Public business directories and listing sites
- Company "About" and "Contact" pages
- Public services/pricing pages
- Industry association member lists (public view)

## Allowed Fields - NOTHING Else
Extract ONLY these lawful public business fields:
| Field | Typical Source |
|-------|----------------|
| businessName | directory listing, site header |
| website | listing link, site footer |
| category | directory taxonomy |
| location | published business address/city |
| email | publicly listed business email |
| phone | publicly listed business phone |
| services | services/products page content |
| sourceUrl | the page each record came from |

No individual names, no personal mobile numbers, no inferred or enriched data.

## Instructions

### Extraction Workflow
1. `browser_connect(profile)` using an authorized/default browser profile
2. `navigate(url)` to the public directory or business page
3. `inspect_page()` and extract ONLY the allowed fields
4. Attach `sourceUrl` to every record - records without it are invalid
5. Move on politely at any access barrier (see Hard Rules)

### Name Normalization
- Trim whitespace; collapse repeated spaces and punctuation
- Normalize legal suffixes: LLC = L.L.C., Inc = Incorporated
- Strip duplicated location suffixes ("Bistro, Downtown" → "Bistro")
- Preserve official capitalization from the primary source

### Deduplication
Merge on normalized `(businessName, location)` pairs:
1. Normalize both candidate records
2. Compare names case-insensitively after suffix normalization
3. Compare locations at city/region granularity, ignoring formatting
4. On match: merge, keep the richest field set, union all sourceUrls

### Domain Validation
- Accept only well-formed URLs with a resolvable host (`https://` preferred)
- Flag parked domains and suspicious TLDs as `domainStatus: unverified`
- Confirm the domain loads during navigation; mark dead sites accordingly

### Export Concept
Produce user-ready exports in two shapes:
- **CSV**: flat spreadsheet, one row per merged record, allowed fields as columns
- **JSON**: records grouped by category, with provenance (`sourceUrls[]`, timestamps)

## Hard Rules
- NO CAPTCHA bypass, solving, or anti-bot evasion of any kind
- NO scraping behind paywalls, logins, or other access controls
- NO violation of robots.txt or a site's Terms of Service
- NO sensitive personal data - businesses only, never private individuals
- Human approval is REQUIRED before ANY outreach - the agent never contacts anyone

## Safety
- Hit a login wall, paywall, or CAPTCHA? Skip and log it - do not retry around it
- Discard any record that cannot carry a valid `sourceUrl`
- Mark low-confidence extractions for human review instead of guessing
- Outreach lists remain drafts until a human explicitly approves sending

## Examples
```
User: "Build a lead list of bakeries in Austin from the public directory"
Agent:
1. browser_connect(default) → navigate(directory)
2. inspect_page() per listing → extract allowed fields only
3. Normalize + dedupe records, validate domains
4. Export leads.csv + leads.json; flag low-confidence rows
5. Report: "42 unique bakeries, 3 flagged for review. No outreach sent."
```

```
User: "Email all these bakeries about our wholesale program"
Agent:
1. REFUSE to send anything automatically
2. Build a draft outreach queue via request_approval()
3. Explain: every message requires explicit human approval first
```
