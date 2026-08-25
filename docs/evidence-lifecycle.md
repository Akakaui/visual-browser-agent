# Browser Evidence Lifecycle

The Visual Browser Agent is a delegated browser specialist. The host's default agent remains primary and delegates browser work through MCP.

```text
Primary host agent
  -> Visual Browser Specialist
  -> Visual Browser Agent MCP server
  -> Playwright / managed Chromium / selected Chrome profile
  -> run manifest and evidence files
  -> structured report returned to the primary agent
```

## Capture policy

The specialist should choose evidence based on the task:

| Task | Preferred evidence |
|---|---|
| Simple page lookup or lead record | Structured page data, source URL, optional screenshot |
| UI state or responsive check | Screenshot at each required viewport plus DOM/accessibility snapshot |
| Animation or interaction flow | Short recording plus start/end screenshots and console/network logs |
| Intermittent bug | Full trace, recording, console/network logs, DOM/accessibility snapshot |
| Document review | PDF plus source URL and page metadata |
| Authenticated or sensitive task | Minimum necessary evidence, explicit human approval, no unnecessary storage-state capture |

The browser specialist should not decide whether the final result is a CSV, table, JSON file, Markdown report, or host artifact. It returns structured browser observations and evidence references. The primary agent uses its own file, shell, media, and artifact tools for final presentation or processing.

## Run workspace

Every evidence run has a persistent workspace:

```text
.design/browser/runs/<run-id>/
├── manifest.json
├── screenshots/
├── videos/
├── pdfs/
├── traces/
├── logs/
└── reports/
```

`manifest.json` records the goal, requirements, status, events, artifact IDs, MIME types, source URLs, sizes, sensitivity, and whether an image was embedded in the MCP response.

## MCP lifecycle

The primary agent can explicitly create and close a run:

```text
evidence_start_run
  -> browser actions and evidence tools
  -> evidence_get_run when an intermediate manifest is needed
  -> evidence_finish_run at the end
```

If the agent captures evidence without explicitly starting a run, the adapter creates a run automatically. Run finalization writes:

```text
logs/console.json
logs/network.json
logs/page-state.json
```

The page-state log contains the final DOM and accessibility snapshot when available. Evidence events record the current URL, artifact references, console count, network count, and the fact that DOM/accessibility capture was attempted.

Screenshots are returned as MCP image content where supported. Videos, PDFs, and traces are returned as artifact metadata and local paths. The primary host can process those files with its own tools. For example, FFmpeg can trim or transcode a returned WebM recording:

```bash
ffmpeg -i .design/browser/runs/<run-id>/videos/recording.webm \
  -ss 00:00:02 -t 00:00:05 \
  .design/browser/runs/<run-id>/videos/clip.mp4
```

## Cleanup

The retention manager tracks screenshots, recordings, PDFs, traces, downloads, storage-state files, logs, reports, and thumbnails. Defaults are:

```text
recordings: 3 days
screenshots: 14 days
reports and other evidence: 90 days
sensitive storage state: 1 day
maximum run size: 500 MB
```

Automatic cleanup runs when the MCP server starts if `deleteExpiredAutomatically` is enabled. The primary agent can also call `evidence_cleanup`. Specific deletion requires an explicit confirmation and is restricted to approved directories.

Storage-state files contain cookies and should be treated as sensitive. Do not capture or retain them unless the workflow requires it.

## Safety

The specialist must ask before login, MFA, CAPTCHA handoff, account switching, public posting, messaging, purchases, deletion, or external submission. It must not bypass access controls, rate limits, CAPTCHA, or platform restrictions. Screenshots from authenticated pages may contain personal or customer information and should be minimized.
