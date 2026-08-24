# Install Visual Browser Agent

## For AI Agents

When a user asks you to install the Visual Browser Agent, follow these steps:

### Step 1: Clone and Install

```bash
git clone https://github.com/Akakaui/visual-browser-agent.git
cd visual-browser-agent
npm install
npm run build
```

### Step 2: Initialize

```bash
npx visual-browser-agent init
```

This will:
- Install Chromium (Playwright browser)
- Set up MCP configuration
- Install Agent Skills
- Auto-detect your coding agent and install the wrapper

### Step 3: Test

```bash
npx visual-browser-agent doctor
```

### Step 4: Use

Start the MCP server:

```bash
npx visual-browser-agent mcp
```

Then use the browser tools to complete tasks.

---

## Quick Reference

| Command | What it does |
|---------|--------------|
| `npx visual-browser-agent init` | Install everything |
| `npx visual-browser-agent mcp` | Start MCP server with Chromium |
| `npx visual-browser-agent mcp --extension` | Start with Chrome extension |
| `npx visual-browser-agent doctor` | Check environment |
| `npx visual-browser-agent profiles` | List Chrome profiles |

---

## For Users

Just tell your agent:

> "Install visual-browser-agent from https://github.com/Akakaui/visual-browser-agent and use it to [your task]"

Your agent will handle everything.