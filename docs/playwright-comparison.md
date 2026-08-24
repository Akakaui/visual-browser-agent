# Visual Browser Agent versus Playwright

## Executive summary

**Playwright is the browser automation engine and developer framework. Visual Browser Agent is an agent-facing orchestration layer built on top of Playwright.** Playwright supplies the browser drivers, contexts, pages, locators, auto-waiting, assertions, tracing, video, network controls, and cross-browser execution. Visual Browser Agent adds MCP tools, natural-language routing guidance, human approval boundaries, evidence capture, retention, profile discovery, coding-agent host configuration, and visual-study workflows.

The distinction matters because Visual Browser Agent is not intended to replace Playwright for writing deterministic test suites. It is intended to make Playwright usable by coding agents and everyday users who want an agent to inspect or operate a browser safely.

## Capability comparison

| Capability | Playwright | Visual Browser Agent on this branch |
|---|---|---|
| Browser automation engine | Core implementation for Chromium, Firefox, and WebKit | Uses Playwright Chromium/Chrome through a browser adapter; the current adapter is not yet a full Firefox/WebKit abstraction |
| Test runner | Playwright Test provides tests, assertions, fixtures, retries, tracing, parallelism, and projects | Provides Vitest smoke tests for the agent package; it is not a replacement for Playwright Test |
| Locators | Rich user-facing locators such as role, label, placeholder, text, test id, CSS, XPath, and locator composition | Supports selector-backed stable `locator_ref` handles, ref reuse across actions, and Playwright-style visibility/text/count assertions; role/label locator generation remains a next refinement |
| Navigation and forms | Broad Page API with navigation, typing, forms, uploads, downloads, dialogs, popups, frames, and events | Covers navigation, back/forward/reload, click, fill, press, select, checkbox, scroll, drag, upload, download, tabs, waits, frames, dialogs, visibility, text, attributes, screenshots, recording, tracing, and PDF export |
| Visual evidence | Screenshots, videos, traces, and HTML reports are available through Playwright tooling | Captures screenshots and recordings as approved run artifacts and adds visual-study, responsive-audit, and animation-study workflows |
| Accessibility | Playwright can expose accessibility-related page information, while its agent MCP uses structured accessibility snapshots and element refs | Returns structured accessibility trees and DOM snapshots, plus stable selector-backed locator refs; the next step is generating refs directly from role/name nodes |
| Network and storage | Context cookies, storage state, routing, request/response monitoring, mocking, and WebSocket controls | Exposes cookie listing/clearing with confirmation, approved storage-state export, request capture, and controlled URL routing mocks; response-level/network WebSocket controls remain future work |
| Browser profiles | Playwright can launch branded Chrome channels and persistent contexts, but does not provide a friendly end-user Chrome identity chooser | Adds cross-platform Chrome detection, account-label discovery, `--choose-profile`, named-profile remote debugging, and prompt-routing guidance |
| Human safety | Playwright itself is a general-purpose automation library; policy is left to the application | Blocks public actions by default, requires explicit artifact-deletion confirmation, supports approval and human-input tools, and documents authentication boundaries |
| Coding-agent integration | Official Playwright MCP and CLI already target coding agents and support many clients | Generates host-specific MCP configs and wrappers for many coding agents, with a universal wrapper for compatible MCP clients |
| Non-technical workflow | Primarily developer-oriented commands and APIs | Provides Chromium versus existing-Chrome guidance, extension-per-profile instructions, account selection by friendly label, and ordinary-language prompt examples |

## Why Visual Browser Agent is different

The first difference is **control-plane behavior**. Playwright answers the question “How do I control a browser reliably?” Visual Browser Agent answers the larger question “How should an AI agent decide what to do, show its work, ask a human, and leave evidence?” The MCP server divides tools into read-only observation, host-controlled actions, policy-controlled workflows, and human approval. That policy layer does not come from Playwright automatically.

The second difference is **visual evidence as a product concept**. A normal Playwright script may take screenshots as test artifacts. Visual Browser Agent treats screenshots, recordings, accessibility trees, DOM snapshots, and review requirements as a run-level evidence package. Its website-study, responsive-audit, and animation-study workflows are opinionated sequences designed for an agent to investigate a site rather than merely execute a test.

The third difference is **identity and profile usability**. Playwright can work with a persistent browser context or a branded Chrome channel, but it does not know which Chrome profile a non-technical person means by “my Work account.” Visual Browser Agent now reads friendly Chrome account labels where available and provides an interactive chooser. The user can select an account by number or visible label; the underlying `Default` or `Profile 3` directory remains an implementation detail.

The fourth difference is **integration packaging**. Playwright’s official MCP and CLI are already strong choices for direct agent browser control. Visual Browser Agent differentiates itself by generating host configuration, installing specialist wrappers and skills, adding approval conventions, and giving an agent a consistent operating policy across coding clients.

## Where Playwright is still ahead

Playwright remains substantially broader and more mature as an automation platform, especially for deterministic test suites and cross-browser execution. Its official MCP documentation describes more than forty tools across core browser operations, network and storage controls, testing and debugging, tracing, video, PDF generation, and optional mouse/vision primitives.[1] Playwright also supports Chromium, Firefox, WebKit, branded Chrome and Edge channels, mobile device emulation, and a full test runner with auto-waiting, assertions, fixtures, projects, retries, and parallelism.[2]

Visual Browser Agent should therefore use Playwright as its compatibility target rather than reimplementing Playwright APIs one by one. The best architecture is a thin, well-tested adapter that exposes safe high-value tools to agents and a deliberate escape hatch for advanced Playwright workflows, while preserving the evidence and approval layers that make this project distinct.

## Recommended next compatibility milestone

The current milestone now covers stable selector-backed refs, assertions, frames, dialogs, cookies, storage-state export, request inspection, URL routing mocks, console messages, tracing, media emulation, and a confirmation-gated page evaluation escape hatch. The next milestone should add role/label locator generation, full frame-targeted actions, popup/download/dialog result objects, response-level network controls, storage-state restore, device profiles, Firefox/WebKit adapters, and a Playwright Test bridge for teams that want generated tests from agent sessions.

This approach preserves the project’s identity. Playwright remains the low-level engine and test platform; Visual Browser Agent becomes the safe, evidence-producing, profile-aware agent control plane.

## References

[1]: https://playwright.dev/mcp/introduction "Playwright MCP introduction and available tools"
[2]: https://playwright.dev/docs/browsers "Playwright browser support and configuration"
[3]: https://playwright.dev/ "Playwright official overview"
[4]: https://playwright.dev/docs/api/class-browsercontext "Playwright BrowserContext API"
