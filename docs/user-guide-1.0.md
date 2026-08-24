# Visual Browser Agent 1.0 User Guide

Visual Browser Agent is **Playwright with an agent control plane**. Playwright performs browser automation; Visual Browser Agent adds MCP tools, Chrome identity selection, visual evidence, local diagnostics, agent wrappers, approval gates, and portable artifacts. The intended experience is simple: a person describes the browser task in the coding agent they already use, and the coding agent chooses the appropriate browser operation.

> A normal user should think in terms of **the task, the account, and the approval**, not Chromium, CDP, `Profile 3`, selectors, or MCP internals.

## 1. The everyday experience

After one-time setup, start a conversation in Claude Code, Cursor, Antigravity, Gemini, Windsurf, Cline, Roo, Kiro, Copilot, Codex, Goose, OpenCode, or another MCP-capable coding agent and say:

```text
Use the browser to open this website and check the layout.
```

For a public website, the agent can use a clean managed Chromium session. For an existing signed-in account, say:

```text
Use my Work Chrome account to inspect the dashboard. Do not change anything.
```

The agent should discover available friendly identities, show labels such as `Work — work@example.com`, and ask you to choose if more than one identity could satisfy the request. You should not need to identify `Default`, `Profile 2`, or `Profile 3`.

For a consequential action, use explicit language:

```text
Fill the form, show me exactly what will be submitted, and ask for approval before sending it.
```

The agent should prepare the action, identify the site and target, pause for approval, and proceed only after an explicit confirmation.

## 2. One-time installation

### Natural-language installation

Ask the coding agent:

```text
Install Visual Browser Agent for this coding agent. Check what is missing, explain what you plan to install or change, and ask for confirmation before installing software or changing browser settings.
```

A technical installer or the agent should install the package, initialize configuration, install the Playwright Chromium runtime after approval, register the MCP server, and install the browser-specialist wrapper and skills for the selected host.

### Command-line installation

From npm:

```bash
npm install -g visual-browser-agent
visual-browser-agent init
visual-browser-agent doctor
```

For project-local installation:

```bash
npm install visual-browser-agent
npx visual-browser-agent init
npx visual-browser-agent doctor
```

`doctor` is a diagnostic command. It does not select an account or silently change browser settings. If Chromium is missing, the agent or operator should use the confirmation-gated runtime installation path.

## 3. Choosing clean Chromium or existing Chrome

| Choice | Use it when | What it contains | Recommended wording |
|---|---|---|---|
| Clean managed Chromium | Public websites, repeatable visual QA, research, isolated testing | A fresh Playwright browser context | “Use a clean browser and audit this page.” |
| Existing Chrome | Gmail, internal dashboards, social accounts, existing cookies, open tabs | The selected Chrome profile and its current session | “Use my Work Chrome account.” |
| Extension mode | You need the currently open Chrome identity and tabs | The Chrome profile where the extension is installed and connected | “Use my current Chrome session.” |
| CDP mode | Advanced technical integrations and controlled local debugging | A browser exposed on a local debugging endpoint | “Connect to the local debugging browser on port 9222.” |

If the user says only “use the browser,” automatic mode should prefer a detectable connected Chrome session and otherwise use managed Chromium. For sensitive work, the user should state the identity and read-only requirement explicitly.

## 4. Installing the Chrome extension

The extension is installed **per Chrome profile**. Installing it in Personal Chrome does not install it in Work Chrome. For each identity that should be available to the agent:

1. Open Chrome and select the desired account from the profile button.
2. Visit `chrome://extensions/`.
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select the package’s `browser-extension` directory.
6. Pin **Visual Browser Agent Bridge** and verify its status.
7. Keep that Chrome profile open while the agent uses it.

Repeat these steps for every profile that should be controllable. The source is the same, but Chrome keeps extensions, permissions, cookies, tabs, and signed-in identities separate by profile.

Ask the coding agent to diagnose the connection:

```text
Check whether my current Chrome profile is connected to Visual Browser Agent. If not, explain the one repair step I need to take.
```

Do not expose the local bridge or remote-debugging port to the public internet. Do not paste passwords, API keys, session tokens, or one-time codes into the agent conversation.

## 5. How a coding agent interacts with Visual Browser Agent

MCP clients first discover the server’s tools and schemas, then the model selects tools based on the user’s request. The MCP specification describes this as a model-controlled tool flow, while recommending that the client keep a human able to deny invocations and provide clear visual indicators.[^1]

Visual Browser Agent organizes its capabilities into practical groups:

| Group | Examples | Normal behavior |
|---|---|---|
| Setup and diagnosis | `setup_status`, `install_runtime`, `browser_doctor` | Explain readiness and request confirmation before installation changes |
| Browser connection | `browser_connect`, `browser_status`, `tabs` | Connect to managed Chromium, extension Chrome, or CDP |
| Page work | `navigate`, `inspect_page`, `get_text`, `get_attribute`, `is_visible` | Read page state and return structured observations |
| Playwright interactions | `click`, `fill`, `press`, `select_option`, `check`, `drag`, `upload_file`, `download_file` | Execute host-controlled actions with clear targets |
| Locator and assertions | `locator_by_role`, locator references, `assert` | Prefer accessible role/name targeting and web-first checks |
| Evidence | `capture_screenshot`, `pdf_save`, `record_interaction`, `trace_start`, `trace_stop`, `review_visual_evidence` | Produce visual and machine-readable proof |
| Browser engineering | frames, tabs/pages, storage state, cookies, network routing, media emulation | Support repeatable Playwright-style workflows |
| Human interaction | `ask_human`, `request_approval`, `submit_public_action` | Ask for missing decisions or explicit authorization |

The host agent remains responsible for its own permission UI. Visual Browser Agent’s safety checks are an additional local layer and should not be treated as permission to bypass the host’s approval system.

## 6. Artifacts and the host agent’s artifact panel

### What an artifact is

An artifact is evidence produced by the browser task: a screenshot, recording, PDF, trace archive, HTML/Markdown report, JSON manifest, accessibility snapshot, DOM snapshot, or structured tool result. MCP tool results can contain text, images, audio, resource links, embedded resources, and structured JSON.[^2]

Visual Browser Agent returns portable evidence in two forms whenever possible:

1. An embedded result that a host can render directly, such as an MCP image content block containing base64 image data and a MIME type.
2. A portable metadata object containing the artifact name, type, requirement, timestamp, and local path or evidence URL fallback.

This dual format matters because coding-agent hosts differ. A UI agent may show the screenshot in an artifact panel, a CLI agent may print the metadata and local path, and a generic MCP client may display the image block or save the resource link. The browser agent must not assume that every host can open an arbitrary sandbox path.

### What the agent should return

Every visual task should return a short explanation plus evidence with:

| Field | Purpose |
|---|---|
| Title | Gives the artifact panel a meaningful label |
| Objective | States what the agent was asked to verify |
| URL and origin | Shows which website was inspected |
| Identity | Shows whether the session was managed Chromium or a selected Chrome identity |
| Actions | Records navigation, clicks, fills, and other browser operations |
| Assertions | Separates verified facts from observations or guesses |
| Screenshots | Lets a person review layout and visible state |
| Console/network findings | Shows technical failures that may not be visible |
| Timestamp and run ID | Makes evidence traceable |
| Next step | Explains what needs approval, repair, or follow-up |

A screenshot is not proof that a submission succeeded. For a submit, purchase, publish, delete, or send operation, the agent should pair the screenshot with a response/status check or an explicit success indicator.

### Host-specific expectations

Claude Code documents artifacts as live interactive pages published to a private or shared URL. It asks for permission before publishing a new artifact, and it describes artifacts as suitable when a visual page is easier to review than terminal text.[^3] A Visual Browser Agent result can be used as the source material for that page: the agent can place screenshots, trace links, a run summary, and structured findings into the host’s artifact workflow.

Google describes Antigravity as an agent-first platform where agents work across the editor, terminal, and browser and communicate progress through artifacts such as screenshots and walkthroughs. Its guidance emphasizes reviewing artifacts instead of scrolling through raw logs.[^4] Visual Browser Agent therefore treats evidence as a deliverable, not as an incidental file dumped into a directory.

A host that has no artifact panel can still use the output. The agent should say where the local evidence viewer is, provide the local dashboard URL when enabled, and include a portable JSON/Markdown summary. The user can also ask:

```text
Make a self-contained HTML report of this browser run with the screenshots embedded, and give me the file path.
```

### What the local dashboard does

The local dashboard is a control and evidence surface at `http://127.0.0.1:8787/`. It is useful when the coding agent is running in a terminal, when the host cannot render image blocks, or when a person wants to inspect connection health and recent evidence without reading tool logs. It is local-only and does not replace the coding-agent conversation or the host’s artifact panel.

## 7. Questions, human input, and approval

There are three different human interactions. They should not be conflated.

| Interaction | Example | Required user response | Safety purpose |
|---|---|---|---|
| Clarifying question | “Which Chrome identity should I use?” | A choice or short answer | Resolves ambiguity before browser work |
| Human takeover | “Chrome is asking for your password or MFA code.” | User operates the browser or enters the secret directly | Keeps credentials out of agent context |
| Approval request | “Approve sending this message to 12 recipients?” | Explicit approve or deny | Authorizes an external, public, destructive, or consequential action |

`ask_human` is the local fallback question tool. It can show a question, options, and a flat form schema. When a host supports native interactive MCP input, the host may render the same decision in its own question UI. MCP form-mode elicitation is designed for structured primitive values and requires the client to show which server asked, allow review/edit, and provide decline/cancel options.[^5]

Do not use an ordinary question form to collect passwords, API keys, access tokens, payment credentials, or one-time codes. MCP guidance requires sensitive interactions to use an out-of-band URL flow rather than exposing the secret through the MCP client.[^5] In Visual Browser Agent’s normal browser flow, the safer pattern is to ask the user to take over the existing Chrome window and enter the secret themselves.

`request_approval` is different from `ask_human`. It must include the exact action, reason, site, target, and relevant data summary. Examples include sending a message, publishing a page, purchasing an item, deleting artifacts, submitting a form, or changing external data. The user can deny the request; denial is a valid result and must be reported without retrying silently.

## 8. Safe daily-use prompts

### Read-only research

```text
Use a clean browser to study this public website. Capture desktop and mobile screenshots, inspect the accessibility tree, and report console errors. Do not click anything that changes data.
```

### Existing signed-in account

```text
Show me the Chrome identities available to Visual Browser Agent. I will choose one. Then inspect the dashboard read-only and show me the evidence.
```

### Review before action

```text
Prepare this form but do not submit it. Show me the exact visible fields and values, then ask for approval.
```

### Human takeover

```text
If the site asks for login, MFA, a password, or a one-time code, stop and ask me to take over the browser. Do not ask me to paste the secret into chat.
```

### Artifact-panel review

```text
Create a visual report with the screenshots, assertions, console errors, and a short conclusion. Return it as a host-renderable artifact and also provide a local fallback.
```

## 9. Technical commands

| Command | Purpose |
|---|---|
| `visual-browser-agent init` | Initialize configuration, skills, and host integration |
| `visual-browser-agent doctor` | Diagnose Chrome, Chromium, profiles, and local readiness |
| `visual-browser-agent dashboard` | Start the local control panel and evidence viewer |
| `visual-browser-agent profiles` | List friendly Chrome profile metadata |
| `visual-browser-agent mcp --managed` | Start the MCP server without attaching to an existing debug browser |
| `visual-browser-agent mcp --extension` | Start the MCP server for an existing Chrome session |
| `visual-browser-agent mcp --choose-profile` | Launch or connect using an interactively selected friendly identity |
| `visual-browser-agent host <agent>` | Generate configuration and wrapper files for a named coding agent |

For technical users, the generated MCP configuration uses a local stdio server. Claude Code’s current MCP guidance documents local stdio servers as appropriate when a server needs direct local-system access, and warns users to verify that they trust connected servers.[^6]

## 10. Troubleshooting

| Symptom | What it means | Repair |
|---|---|---|
| Chromium is unavailable | Playwright’s browser binary is not installed | Ask the agent to check setup status and request approval to install Chromium |
| No Chrome identity appears | The profile has not been opened, has no readable account metadata, or Chrome is unavailable | Open the profile once, sign in if appropriate, and rerun diagnostics |
| Extension is installed but inactive | The selected profile’s bridge is not connected to the local agent | Keep that profile open, start the MCP server, pin/reload the extension, and ask the agent to diagnose |
| The wrong account is selected | The request was ambiguous or the wrong friendly label was chosen | Ask the agent to list identities again and explicitly name the desired account |
| The host shows only text | The host does not render MCP image/resource blocks or has no artifact panel | Open the local dashboard or ask for a self-contained HTML/Markdown report |
| A tool asks for a password | The website requires user interaction | Take over the browser; never paste the credential into the agent conversation |
| An action is blocked | The operation is public, destructive, or policy-controlled | Review the exact approval request and approve or deny explicitly |
| MCP starts but no tools appear | The host has not loaded or refreshed the local server configuration | Restart the host, verify the MCP command, and run `doctor` |

## 11. Privacy and security

Visual Browser Agent is local-first. Existing Chrome sessions contain private data, so use extension or CDP mode only on a trusted machine, restrict the bridge to localhost, keep approved artifact directories controlled, and avoid sharing screenshots or traces that contain personal information. Review artifacts before placing them in a public host artifact link.

Host permission systems remain important. Claude Code, for example, documents separate approval behavior for read-only tools, shell commands, file modifications, web access, and MCP tools, with deny, ask, and allow rules.[^7] Configure the host so read-only inspection can be convenient while browser actions and external side effects remain reviewable.

## References

[^1]: [Model Context Protocol — Tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
[^2]: [Model Context Protocol — Tool Results and Content](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
[^3]: [Claude Code — Share session output as artifacts](https://code.claude.com/docs/en/artifacts)
[^4]: [Google Antigravity — Build with an agentic development platform](https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/)
[^5]: [Model Context Protocol — User Elicitation](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation)
[^6]: [Claude Code — Connect to tools via MCP](https://code.claude.com/docs/en/mcp)
[^7]: [Claude Code — Configure permissions](https://code.claude.com/docs/en/permissions)
