# Changelog

## 1.0.0 — 2026-08-24

Visual Browser Agent 1.0 is a local-first, agent-native browser operating layer built on Playwright.

### Added

- Playwright-backed MCP tools for navigation, tabs/pages, frames, locator references, role/name targeting, web-first assertions, storage state, cookies, network mocks, tracing, console/network inspection, media emulation, screenshots, PDF evidence, recordings, and downloads.
- Friendly Chrome identity discovery using account labels and email metadata rather than requiring users to know technical profile directory names.
- Per-profile Chrome Bridge extension documentation and connection diagnostics.
- Setup status, browser doctor, runtime installation, local dashboard, and evidence viewer workflows.
- Host-compatible evidence responses with embedded image content and portable metadata fallbacks.
- Agent wrappers and host configuration generation for Claude Code, Antigravity, Cursor, Gemini, Windsurf, Cline, Roo, Kiro, Copilot, Codex, Goose, OpenCode, and generic MCP clients.
- Explicit human questions, takeover guidance, approval requests, and protection for public or destructive actions.
- Maintained MCP protocol acceptance test and release CI quality gate.
- Comprehensive [1.0 User Guide](docs/user-guide-1.0.md) and [agent artifact research note](docs/agent-artifact-research.md).

### Safety and privacy

- Local-first operation with approved artifact directories.
- Confirmation requirements for runtime installation, dangerous page evaluation, public submissions, and artifact deletion.
- Guidance not to pass passwords, tokens, payment credentials, or one-time codes through agent prompts.

### Verification

- TypeScript build, ESLint, unit tests, dashboard checks, package dry-run, clean npm install, extension manifest validation, and MCP initialize/tools/call protocol smoke test pass on the release candidate.
