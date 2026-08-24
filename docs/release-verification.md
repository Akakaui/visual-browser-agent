# Visual Browser Agent 1.0 Release Verification

## Verification date

August 24, 2026.

## Release candidate

The repository is being prepared for `visual-browser-agent@1.0.0` on the merged `master` branch. The release includes the Playwright-backed MCP runtime, friendly Chrome identity discovery, the per-profile Chrome Bridge extension, local dashboard/evidence viewer, host wrappers, safety controls, the maintained MCP protocol smoke test, and the comprehensive [1.0 user guide](user-guide-1.0.md).

## Executed checklist

| Checklist item | Verification | Result |
|---|---|---|
| Repository and dependency installation | Removed `node_modules` and completed `npm ci` | PASS |
| Lint | `npm run lint` after removing 22 unused-symbol warnings | PASS; zero errors and zero warnings |
| TypeScript build | `npm run build` | PASS |
| Unit tests | `npm test` | PASS; 4 tests across 2 files |
| MCP initialize | Protocol harness initialized the stdio server and verified server identity | PASS |
| MCP tool discovery | `tools/list` returned 57 tools, including setup, connection, navigation, screenshots, locators, assertions, questions, and approvals | PASS |
| Managed browser connection | `browser_connect` launched managed Chromium headlessly | PASS |
| Navigation | `navigate` opened `https://example.com` and returned title, URL, accessibility tree, DOM snapshot, viewport, timing, and console metadata | PASS |
| Portable screenshot result | `capture_screenshot` returned a successful tool result with embedded image content and metadata | PASS |
| Role/name locator | `locator_by_role` found the visible `Learn more` link | PASS |
| Human approval gate | `request_approval` displayed site, target, action, reason, and accepted an explicit `no` response | PASS; denial preserved |
| Dashboard root | Local dashboard served over `127.0.0.1` | PASS |
| Profiles API | Dashboard profile endpoint returned valid JSON; no profiles were available in the test environment | PASS; environment had zero discoverable profiles |
| Evidence API | Dashboard evidence endpoint listed captured screenshots | PASS |
| Evidence download | Dashboard served a real `1280 × 720` PNG from the evidence endpoint | PASS |
| Browser doctor | Packaged and repository CLI diagnostics ran successfully | PASS |
| Extension manifest | Manifest parsed as Manifest V3 and permissions were inspectable | PASS |
| Host integrations | Generation commands completed for Claude Code, Antigravity, Cursor, Gemini, Windsurf, Cline, Roo, Kiro, Copilot, Codex, Goose, and OpenCode | PASS |
| Package contents | Tarball contains runtime, CLI, extension, installation guide, README, license, changelog, user guide, and research note; no run logs or tarballs are included | PASS |
| Clean npm installation | `visual-browser-agent-1.0.0.tgz` installed into a new npm project; `--version` returned `1.0.0`; `doctor` ran | PASS |
| Secret-pattern scan | Common private-key and API-key patterns were scanned outside dependencies and release logs | PASS |
| CI publication gate | GitHub Actions release workflow runs lint, build, unit tests, and MCP protocol acceptance before provenance publication | PASS |

The maintained protocol test is available as `npm run test:mcp`. It is portable across checkouts because it uses the current working directory by default and can be overridden with `VBA_REPO`.

## Artifact-panel and human-input review

The new user guide incorporates current MCP guidance that tool results can contain text, images, resource links, embedded resources, and structured JSON.[^1] It also documents the distinction between a host-rendered artifact panel and Visual Browser Agent’s local evidence fallback. This is important because a UI host may render an image or HTML report directly while a CLI host may need a local path or JSON manifest.

The guide also follows current MCP elicitation guidance: ordinary form questions should be structured, reviewable, cancellable, and limited to non-secret values; sensitive authentication, payment, and credential collection must not be performed through a normal form question.[^2] The supported operational pattern is for the user to take over the existing browser and enter secrets directly. Public, destructive, or consequential actions use a distinct approval flow.

The host guidance is grounded in current Claude Code artifact and permission documentation and Google’s Antigravity description of artifacts as screenshots, walkthroughs, and other reviewable deliverables rather than raw logs.[^3] [^4] The implementation therefore returns evidence with objective, URL, identity, actions, assertions, errors, timestamps, and a fallback path whenever available.

## Manual boundary

The automated environment had no discoverable Chrome profiles, so it could not prove a real multi-profile identity selection with two signed-in accounts. The extension manifest and dashboard/API checks passed, and the extension installation guide explicitly documents that the extension must be loaded separately in each Chrome profile. Before public 1.0 release, a human must perform the two-profile test on a workstation containing at least two Chrome identities: install the extension in both, select each by friendly name, confirm the active connection changes, and verify that a closed or disconnected profile produces a repair explanation.

The automated suite also does not impersonate third-party login, CAPTCHA, payment, or real public submission flows. Those are intentionally manual safety tests. The release operator must verify that password/MFA entry is handed back to the user and that send, publish, purchase, delete, and submit actions cannot proceed without explicit approval.

## Release decision

All executable repository, build, protocol, dashboard, packaging, host-integration, and documentation gates pass for the `1.0.0` release candidate. The release may be tagged after the manual two-profile Chrome and risky-action approval tests are completed on a trusted workstation. If those manual checks are not performed, the honest label is `1.0.0-rc.1`, not final 1.0.

## References

[^1]: [Model Context Protocol — Tools and Tool Results](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
[^2]: [Model Context Protocol — User Elicitation](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation)
[^3]: [Claude Code — Share session output as artifacts](https://code.claude.com/docs/en/artifacts)
[^4]: [Google Antigravity — Build with an agentic development platform](https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/)
