# Agent Artifact and Human-in-the-Loop Research

## Scope

This note records current external guidance relevant to Visual Browser Agent 1.0: how MCP clients discover and invoke tools, how servers return screenshots and other artifacts, how servers ask users questions, and how coding-agent hosts use visual artifacts for review.

## Findings

| Topic | Verified guidance | Implication for Visual Browser Agent |
|---|---|---|
| MCP tool control | MCP tools are model-controlled: the client exposes tools, the model selects a tool, and the client sends `tools/call`. MCP guidance recommends a human ability to deny invocations and clear visual indicators. | Tool descriptions must state risk and expected side effects. High-impact browser actions must be approval-gated, and the dashboard/host response should make the action visible. |
| Tool results | MCP tool results can contain text, images, audio, resource links, embedded resources, and structured JSON. Image content uses base64 data plus a MIME type; structured output can be returned in `structuredContent` and should also be represented as text for compatibility. | Screenshot and evidence tools should return embedded image data where possible, a portable metadata manifest, and a local fallback path. Hosts that cannot render image blocks can still inspect JSON/Markdown. |
| Form questions | MCP elicitation form mode lets a server request structured primitive values through the client, with a flat JSON Schema. The client should show which server asked, allow review/edit, and allow decline/cancel. | `ask_human` should clearly explain why input is needed, keep schemas flat and reviewable, and support cancel. It must not collect passwords, API keys, access tokens, or payment credentials. |
| Sensitive interaction | MCP URL-mode elicitation is intended for sensitive interactions such as authentication and payment. The client must show the target host and obtain consent before navigation; data other than the URL is not exposed through MCP. | Never ask for secrets through an ordinary browser-agent question or form. Use the user’s own browser/secure URL flow and avoid logging sensitive values. |
| Claude Code artifacts | Claude Code describes an artifact as a live interactive page published to a private or shared URL. It asks permission before publishing a new artifact. Artifacts are appropriate when a visual page is easier to review than terminal text; they are not a backend application. | Visual Browser Agent should distinguish a local evidence report from a host-published artifact. It should return self-contained HTML/Markdown plus screenshots and explain that publication/sharing is controlled by the host agent. |
| Claude Code permissions | Claude Code uses tiered permissions and supports approvals/denials for MCP tools, file changes, shell commands, and artifact publication. Permission decisions are host-enforced rather than prompt-only. | Visual Browser Agent’s own safety layer is defense in depth, not a replacement for host permissions. Tool responses should be explicit enough for a host approval prompt to summarize. |
| Google Antigravity artifacts | Google describes Antigravity as an agent-first development platform where agents work across editor, terminal, and browser, then communicate progress through artifacts such as screenshots and walkthroughs. Artifacts are intended to let a human verify work without reading raw logs and can receive feedback. | Browser evidence should be designed as reviewable deliverables: title, objective, URL, identity, actions, screenshots, assertions, errors, timestamps, and next steps. A host can display them in its artifact panel or open the generated HTML locally. |

## Recommended interaction contract

1. The user asks in ordinary language, for example, “Use my Work Chrome account to inspect the dashboard and show me what changed.”
2. The coding agent discovers the browser tools and calls setup/status first when necessary.
3. Visual Browser Agent returns friendly identities and connection state rather than technical profile directory names.
4. The agent asks a question only when it lacks a required decision, such as which account, which tab, or whether to continue after a login wall.
5. For a public or destructive action, the agent creates a precise approval request containing site, origin, target, action, data summary, and consequences. The user can approve or deny.
6. The agent performs the action and returns both a concise summary and portable evidence. A host UI may render image blocks directly, open HTML in an artifact panel, or show a link/path fallback.
7. The agent never treats a screenshot as proof that an action succeeded without a corresponding assertion or response/status check.

## Sources

[1]: https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation "Model Context Protocol: Elicitation"
[2]: https://modelcontextprotocol.io/specification/2025-11-25/server/tools "Model Context Protocol: Tools"
[3]: https://code.claude.com/docs/en/artifacts "Claude Code: Share session output as artifacts"
[4]: https://code.claude.com/docs/en/permissions "Claude Code: Configure permissions"
[5]: https://code.claude.com/docs/en/mcp "Claude Code: Connect to tools via MCP"
[6]: https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/ "Google Antigravity: Build with an agentic development platform"
