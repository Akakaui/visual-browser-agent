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

## Installation

### Option 1: From GitHub (Recommended for Testing)

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

### Option 2: From npm (After Publishing)

```bash
# Install globally
npm install -g visual-browser-agent

# Or use directly with npx
npx visual-browser-agent init
```

### Option 3: Local Development

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
| `npx visual-browser-agent host <agent>` | Install for specific coding agent |
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