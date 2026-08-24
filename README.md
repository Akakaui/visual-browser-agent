# Visual Browser Agent

A local-first browser automation tool that gives AI agents “eyes and hands” for web interaction. Visual Browser Agent is **Playwright plus an agent control plane**: Playwright performs the browser work, while this project adds MCP tools, visual evidence, approvals, Chrome identity handling, safety controls, and workflows for coding agents and everyday browser tasks.

## What happens after installation

You do not need to understand Chromium, CDP, remote debugging, or Chrome’s internal profile names.

A technical installer registers Visual Browser Agent with the coding agent you use and installs the Playwright browser runtime. After that, your normal workflow happens in the coding-agent chat. You can say:

```text
Use the browser to open this website and check the layout.
```

The agent first checks whether an existing Chrome session is available. If it finds one, it uses that session; otherwise it launches a clean Playwright-managed Chromium session. You can also be explicit in ordinary language:

```text
Use my Work Chrome account and check the dashboard.
```

The agent discovers friendly Chrome identities such as “Work — work@example.com” and “Personal — personal@example.com.” If there is more than one possible identity, it asks you to choose in the conversation. You do not run a profile command or select `Profile 3`.

Visual Browser Agent also includes an optional local control panel. A technical user can start it with `npx visual-browser-agent dashboard`, but the control panel is not required for normal use. It shows connection health, the active tab, available Chrome identities, and recent evidence at `http://127.0.0.1:8787/`.

Before the agent logs in, sends a message, publishes, purchases, deletes, submits, or changes external data, it pauses and asks for approval. Read-only inspection, screenshots, visual audits, and evidence capture can proceed automatically.

## How It Works

There are **two browsers** and **two connection methods**:

| Browser | What it is | When to use |
|---------|-----------|-------------|
| **Chromium** | Playwright's built-in browser | Default. Works everywhere. No sign-in needed. |
| **Chrome** | Your actual Chrome browser | When you need your existing logins, cookies, sessions. |

| Connection | Browser | How it works |
|------------|---------|--------------|
| **MCP** | Chromium | Agent controls Chromium via MCP protocol |
| **Extension** | Chrome | Agent connects to your existing Chrome via extension |

---

## Installation

### Option 1: Ask your coding agent to install it

In Claude Code, Cursor, Copilot, Codex, Gemini, Windsurf, Cline, Roo, Kiro, Goose, OpenCode, Antigravity, or another MCP-capable coding agent, ask:

```text
Install Visual Browser Agent, set it up for this coding agent, and check that the browser runtime is ready. Ask me before installing software or changing browser settings.
```

The agent should check setup status, ask for confirmation before installing Playwright Chromium, register the MCP server, and report any missing permission or extension step. Then you can simply say “use the browser to …”.

### Option 2: From GitHub (Recommended for Testing)

```bash
# Clone the repo
git clone https://github.com/Akakaui/visual-browser-agent.git
cd visual-browser-agent

# Install dependencies
npm install

# Build
npm run build

# Initialize (installs Chromium + MCP + skills)
npx visual-browser-agent init
```

Or use directly with npx:

```bash
npx github:Akakaui/visual-browser-agent init
```

### Option 3: From npm (After Publishing)

```bash
# Install globally
npm install -g visual-browser-agent

# Or use directly with npx
npx visual-browser-agent init
```

### Option 4: Local Development

```bash
# Clone the repo
git clone https://github.com/Akakaui/visual-browser-agent.git
cd visual-browser-agent

# Install in development mode
npm install

# Build
npm run build

# Link for global use
npm link

# Now you can use it anywhere
visual-browser-agent init
```

---

## Quick Start

### 1. Initialize

```bash
npx visual-browser-agent init
```

This will:
- Install Chromium (Playwright browser)
- Set up MCP configuration
- Install Agent Skills
- Auto-detect your coding agent and install the wrapper

### 2. Start Using

```bash
# Start MCP server with Chromium (default)
npx visual-browser-agent mcp

# Or start with Chrome extension
npx visual-browser-agent mcp --extension
```

### 3. Use in Your AI Agent

Ask your agent: "Research this website's design"

The agent will use the Visual Browser Agent to control the browser.

---

## Using Your Existing Chrome (Extension)

If you need your agent to use your existing Chrome (with your logins, cookies, sessions):

### 1. Install the extension

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select: `node_modules/visual-browser-agent/browser-extension`

### 2. Start the agent

```bash
npx visual-browser-agent mcp --extension
```

### 3. Use in your AI agent

Ask your agent: "Log into my Gmail and summarize my emails"

The agent connects to **your Chrome** with all your logins intact.

---

## Integration with AI Agents

### Auto-Detection (Recommended)

When you run `npx visual-browser-agent init`, it automatically:
- Detects which coding agent you're using
- Installs the appropriate wrapper
- Sets up MCP configuration

### Manual Installation

If auto-detection doesn't work, you can install manually:

```bash
# Install for specific agent
npx visual-browser-agent host <agent-name>
```

Supported agents:
- `claude-code`
- `cursor`
- `gemini`
- `opencode`
- `antigravity`
- `windsurf`
- `cline`
- `roo`
- `kiro`
- `copilot`
- `codex`
- `goose`

### Claude Code

Add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "visual-browser": {
      "command": "npx",
      "args": ["visual-browser-agent", "mcp"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "visual-browser": {
      "command": "npx",
      "args": ["visual-browser-agent", "mcp"]
    }
  }
}
```

### For Chrome Extension Mode

```json
{
  "mcpServers": {
    "visual-browser": {
      "command": "npx",
      "args": ["visual-browser-agent", "mcp", "--extension"]
    }
  }
}
```

---

## How AI Agents Use This

### Scenario 1: Research a public website

Agent thinks: "This is a public website, no login needed."

Agent does: Uses Chromium (default)

```bash
npx visual-browser-agent mcp
```

### Scenario 2: Access user's private data

Agent thinks: "This needs the user's login."

Agent does: Uses Chrome via extension

```bash
npx visual-browser-agent mcp --extension
```

### Scenario 3: User specifies browser

User says: "Use my signed-in Work Chrome account"

Agent does:

```bash
npx visual-browser-agent mcp --choose-profile
```

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `npx visual-browser-agent init` | Install Chromium, MCP, and skills |
| `npx visual-browser-agent mcp` | Start MCP server with Chromium |
| `npx visual-browser-agent mcp --extension` | Start MCP server with Chrome extension |
| `npx visual-browser-agent profiles` | List Chrome profiles |
| `npx visual-browser-agent doctor` | Check environment |
| `npx visual-browser-agent dashboard` | Open the local user control panel |
| `npx visual-browser-agent host <agent>` | Install for specific coding agent |
| `npx visual-browser-agent skill list` | List available skills |

---

## Normal-user control panel

For a non-technical user, the browser agent should be installed and registered once by an administrator or coding-agent setup. The user then works from the coding agent by saying “use the browser to open this website,” “use my Work account,” or “check the page and show me screenshots.” The agent handles connection, identity discovery, evidence, and approvals through MCP.

The optional local control panel is available for connection visibility and recovery. A technical user can launch it with `npx visual-browser-agent dashboard`; it opens at `http://127.0.0.1:8787/` and shows connection health, friendly Chrome identities, the active tab, and recent evidence. The panel is local-only and does not replace the coding-agent conversation.

## Playwright 2.0 compatibility surface

Visual Browser Agent exposes a Playwright-backed MCP surface for agent workflows. In addition to navigation, forms, uploads, downloads, screenshots, recording, responsive audits, and visual studies, agents can use tabs/pages, history, drag-and-drop, locator references, web-first assertions, frame inspection, dialog policy, cookies, approved storage-state export, recent console messages, recent network requests, URL routing mocks, tracing, media emulation, PDF evidence, and confirmation-gated page evaluation.

The compatibility layer intentionally keeps sensitive operations explicit. Clearing cookies requires `confirm=true`; page evaluation requires `confirmDangerous=true`; public submissions and artifact deletion remain governed by the approval service. Network mocks and storage artifacts are restricted to the active agent session and approved directories.

## Profiles

If you have multiple Chrome profiles, choose the signed-in account you want to use with the extension:

```bash
# Choose an account interactively
npx visual-browser-agent mcp --choose-profile

# Advanced: use a known technical profile name
npx visual-browser-agent mcp --profile "Profile 3"
```

---

## Troubleshooting

### Chromium not working

```bash
npx playwright install chromium
```

### Chrome extension not connecting

1. Make sure Chrome is open
2. Check extension icon shows "ON"
3. Try: `npx visual-browser-agent doctor`

### MCP server not starting

```bash
# Check environment
npx visual-browser-agent doctor

# Reinstall
npx visual-browser-agent init
```

---

## Architecture

```
User's AI Agent (Claude Code, Cursor, etc.)
                    |
                    | MCP Protocol
                    |
        Visual Browser Agent MCP Server
                    |
        +-----------+-----------+
        |                       |
    Chromium                  Chrome
    (Playwright)            (Extension)
        |                       |
        v                       v
  Agent controls           Agent connects
  fresh browser            to existing browser
```

---

## License

MIT


## Daily use for non-technical users

Visual Browser Agent can be used in two simple modes:

| Mode | Best for | What the user does |
|---|---|---|
| Chromium | Public websites, research, visual QA, and tasks that do not need personal logins | Start the coding agent with `visual-browser-agent mcp --managed`; the agent connects to a clean Playwright Chromium session. |
| Existing Chrome | Gmail, social accounts, internal tools, and websites where the user is already signed in | Install the extension in the Chrome profile, start `visual-browser-agent mcp --choose-profile`, choose the signed-in account from the displayed list, and ask the coding agent to use the connected browser. |

A non-technical user should not need to understand MCP. After one setup, they can tell their coding agent what they want in ordinary language, for example: “Open the Work Chrome profile, inspect the checkout page at this URL, and save screenshots,” or “Use a clean Chromium session to compare this website on desktop and mobile.” The wrapper instructs the coding agent to check the browser connection, choose the appropriate mode, ask before authentication or consequential actions, and return concise findings with evidence.

### Chrome profiles: extension versus remote debugging

Chrome extensions are installed **per Chrome profile**, not once for every browser window. If a person wants to use three separate Chrome profiles through extension mode, they should open each profile, go to `chrome://extensions/`, enable Developer mode, and load the unpacked `browser-extension/` directory once in each profile. The same extension source can be loaded into every profile, but each profile must grant its own permissions and remain open when that profile is selected.

Remote debugging is different. It connects to a Chrome instance launched with a specific `--profile-directory` and debugging port. Most people should run `visual-browser-agent mcp --choose-profile`; the tool reads friendly account labels from Chrome and lets the user select one by number. The technical `--profile` option remains available for scripts and advanced setups. A profile already in use by another Chrome process may refuse a second launch; close that profile first or use a separate debugging profile and port.

For a user who needs existing login cookies, the extension route is usually the simplest. For a user who wants a repeatable clean browser, Chromium is safer. Remote debugging should be treated as an advanced option because it exposes the selected browser session to the local agent process.

### Selecting the browser agent by prompting

The user normally selects the **task**, not a browser mode or specialist model. Say “use the browser to …” in Claude, Cursor, Copilot, Codex, Gemini, Windsurf, Cline, Roo, Kiro, Goose, OpenCode, Antigravity, or another MCP-capable coding agent. The wrapper tells the agent to use automatic browser selection, discover visible Chrome identities when necessary, and fall back to managed Chromium when no existing session is available. The coding agent chooses the Visual Browser Agent MCP tools after the integration is installed. Prompts should name the session requirement when it matters:

```text
Use a clean Chromium browser. Audit this public website at desktop and mobile widths and save visual evidence.
```

```text
Use the Work account I choose from Chrome. Open the internal dashboard, inspect the layout, and ask me before making any changes.
```

```text
Use the current browser session. Do not submit forms, publish, purchase, delete, or send messages without asking for approval first.
```

If a team wants a named browser specialist, run `visual-browser-agent host <agent-name>` for the coding client and keep the generated MCP configuration plus wrapper in that project. The package includes adapters for Claude Code, Cursor, Gemini, Windsurf, Cline, Roo, Kiro, Copilot, Codex, Goose, OpenCode, and Antigravity, and uses a universal wrapper for hosts without a dedicated wrapper. New hosts can use the same standard MCP configuration: start the command `visual-browser-agent mcp --managed` and register it as an MCP server named `visual-browser`.

### Recommended first-time setup

```bash
npm install
npm run build
npx visual-browser-agent init --mode chromium
npx visual-browser-agent host <your-coding-agent>
```

Then restart the coding agent and ask it to use the visual browser tools. For a clean daily Chromium workflow, use `visual-browser-agent mcp --managed`. For an existing Chrome identity, use `visual-browser-agent mcp --choose-profile` after loading the extension into the desired profile. Use `--profile` only for advanced scripts.

The agent should always use read-only inspection and screenshots automatically when reviewing a website. It should request explicit approval before posting, publishing, purchasing, deleting, submitting, or changing external data. Authentication and private personal information should be supplied by the user directly in the browser, not placed in prompts or configuration files.
