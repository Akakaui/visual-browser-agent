# Visual Browser Agent 1.0 Release Checklist

## Release objective

Version 1.0 should be a stable, cross-agent browser capability built on Playwright. A user should be able to ask any supported coding agent to install or use the browser, choose an existing Chrome identity in ordinary language, inspect or operate a website, receive artifacts in the host agent’s own UI, and understand every approval or failure.

## Required release gates

| Area | Release gate | Evidence |
|---|---|---|
| Build | `npm run build` completes on Node 20 and Node 22 | CI log |
| Tests | Unit, fixture-browser, MCP protocol, and package-install tests pass | CI report |
| Lint | `npm run lint` has zero errors and zero warnings | CI log |
| Package | `npm pack --dry-run` contains runtime, CLI, skills, wrappers, Chrome extension, license, and guide; it contains no secrets or generated runs | Pack manifest |
| CLI | `--help`, `doctor`, `setup`, `dashboard`, `mcp`, `profiles`, and `host` behave correctly | Smoke transcript |
| MCP | Initialize, tools/list, browser_connect, navigate, inspect_page, capture_screenshot, locator_by_role, assert, trace, storage, network, and approval tools work | Protocol transcript |
| Chrome | Existing Chrome connection is documented and tested with at least two profiles | Manual test record |
| Chromium | Managed Playwright Chromium installs and launches cleanly | Doctor output |
| Artifacts | Screenshot, image, PDF, trace, video, Markdown, JSON, and evidence manifest outputs are host-readable and CLI-readable | Artifact bundle |
| Safety | Login, MFA, send, publish, purchase, delete, and submit paths pause for human approval | Safety tests |
| Privacy | Local-only default is documented; telemetry is absent or opt-in; secrets are redacted; retention is configurable | Privacy review |
| Recovery | Every connection and installation failure gives cause and next repair action | Error-message review |
| Release | Changelog, version, Git tag, npm publication, provenance, and clean-install verification are complete | Release record |

## Coding-agent acceptance test

Run these prompts in each supported MCP host: Claude Code, Cursor, Gemini, Windsurf, Cline, Roo, Kiro, Copilot, Codex, Goose, OpenCode, Antigravity, and at least one generic MCP client.

```text
Install Visual Browser Agent for this coding agent. Check what is missing, tell me what you plan to install or change, and ask for confirmation before making changes.
```

Expected result: the agent checks setup status, explains missing components, requests approval, installs only the allowlisted runtime, registers the MCP server, and reports the result without asking the user to understand CDP or profile directory names.

```text
Use the browser to open https://example.com, inspect the page, and show me a screenshot.
```

Expected result: the agent automatically connects to an available Chrome session or managed Chromium, navigates, inspects the page, and returns an image artifact that the host UI can render, plus a fallback path and machine-readable metadata.

```text
Find the link named “Learn more,” verify that it is visible, and do not click it yet.
```

Expected result: the agent uses an accessible role/name locator, returns a reusable locator reference, and completes a visible assertion without inventing a brittle CSS selector.

```text
Audit this page at desktop and mobile widths and show the screenshots in the agent’s artifact panel.
```

Expected result: the agent runs the responsive workflow, captures artifacts for each viewport, returns a Markdown/HTML explanation, and makes the images available to the host agent UI.

```text
Use my Work Chrome account to inspect the dashboard. If several accounts are available, show me friendly names and ask me to choose. Do not send or change anything.
```

Expected result: the agent lists friendly account labels and emails, identifies connection state, asks for a choice when ambiguous, and performs only read-only inspection.

```text
Submit this form and send it.
```

Expected result: the agent prepares the action, identifies the exact site, target, and data, then pauses for explicit approval before submission.

## Package validation

From a clean machine or clean temporary directory:

```bash
npm ci
npm run lint
npm run build
npm test
npm pack --dry-run
npm pack
mkdir /tmp/vba-1-install-check
cd /tmp/vba-1-install-check
npm init -y
npm install /absolute/path/to/visual-browser-agent-*.tgz
npx visual-browser-agent --help
npx visual-browser-agent doctor
```

The package must include `browser-extension/manifest.json`, `browser-extension/background.js`, `EXTENSION_INSTALLATION.md`, `dist`, `bin`, `skills`, `wrappers`, `README.md`, `LICENSE`, and `package.json`. It must not include `runs/`, private credentials, local Chrome data, or development-only files.

## Manual Chrome checks

Open Chrome profile A and install the unpacked extension. Confirm the bridge badge becomes active. Repeat for Chrome profile B. Ask the coding agent to list profiles and select profile A by friendly account label. Switch to profile B and confirm the agent does not silently reuse profile A. Close the extension connection and confirm `browser_doctor` explains the repair step.

## Version and publication

Before publication, update `package.json` to `1.0.0`, update the changelog, commit the release, create tag `v1.0.0`, and push the tag. CI should run the full quality gate and publish with npm provenance. After publication, install `visual-browser-agent@1.0.0` from a clean directory and repeat the CLI and MCP checks.

## 1.0 stop-ship issues

Do not publish 1.0 if the package omits the extension, if host agents receive only inaccessible local paths instead of usable artifacts, if a Chrome identity can be selected but not connected, if risky actions can bypass approval, if secrets appear in logs or reports, if the MCP server cannot initialize, or if the clean-install package cannot run its doctor and MCP commands.
