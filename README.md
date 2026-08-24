# Visual Browser Agent

A local-first browser automation tool that gives AI agents "eyes and hands" for web interaction.

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

## Quick Start (Chromium - Default)

```bash
# 1. Initialize (installs Chromium + MCP + skills)
npx visual-browser-agent init

# 2. Start using with your AI agent
npx visual-browser-agent mcp
```

That's it. Your AI agent can now see and control the browser.

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

## Connection Methods Explained

### MCP (for AI Agents)

MCP (Model Context Protocol) is how AI agents talk to tools. The Visual Browser Agent runs as an MCP server.

**Default behavior:**
- Starts Chromium (Playwright's browser)
- Agent controls it via MCP
- Works with Claude Code, Cursor, Gemini, etc.

**When to use:** Most AI agent tasks.

**Example:**
```bash
npx visual-browser-agent mcp
```

### Extension (for Existing Chrome)

The Chrome extension bridges your existing Chrome to the agent.

**Default behavior:**
- Connects to your running Chrome
- Uses your existing profiles, logins, cookies
- No need to sign in again

**When to use:** When the agent needs your existing logins.

**Example:**
```bash
npx visual-browser-agent mcp --extension
```

---

## Why Two Browsers?

### Chromium (Default)

- **Pros:** Works everywhere, no setup, fresh state each time
- **Cons:** No existing logins, need to sign in to everything
- **Use for:** Public websites, research, design inspection

### Chrome (Extension)

- **Pros:** All your existing logins, cookies, bookmarks, extensions
- **Cons:** Requires Chrome installed, needs extension setup
- **Use for:** Tasks requiring authentication (Gmail, social media, banking, etc.)

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

User says: "Use my Chrome with Profile 3"

Agent does:

```bash
npx visual-browser-agent mcp --extension --profile "Profile 3"
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
| `npx visual-browser-agent skill list` | List available skills |

---

## Profiles

If you have multiple Chrome profiles, you can specify which one to use with the extension:

```bash
# See your profiles
npx visual-browser-agent profiles

# Use specific profile with extension
npx visual-browser-agent mcp --extension --profile "Work"
```

---

## Installation

### Prerequisites

- Node.js 18+
- Chrome (optional, for extension mode)

### Install

```bash
npm install visual-browser-agent
```

Or use directly:

```bash
npx visual-browser-agent init
```

### What `init` does

1. Installs Chromium (Playwright browser)
2. Installs MCP server configuration
3. Installs Agent Skills
4. Creates config file

---

## Integration with AI Agents

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