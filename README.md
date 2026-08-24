# Visual Browser Agent

A local-first browser automation tool that gives AI agents "eyes and hands" for web interaction.

## For Users (Non-Technical)

Just tell your AI agent:

> "Install visual-browser-agent from https://github.com/Akakaui/visual-browser-agent and use it to [your task]"

Your agent will handle everything automatically.

### Example Tasks

- "Install visual-browser-agent and research this website's design"
- "Install visual-browser-agent and check my Facebook"
- "Install visual-browser-agent and take screenshots of this website"

---

## For AI Agents

See [INSTALL.md](INSTALL.md) for detailed instructions.

### Quick Start

```bash
git clone https://github.com/Akakaui/visual-browser-agent.git
cd visual-browser-agent
npm install
npm run build
npx visual-browser-agent init
npx visual-browser-agent mcp
```

---

## How It Works

| Browser | What it is | When to use |
|---------|-----------|-------------|
| **Chromium** | Playwright's built-in browser | Default. Works everywhere. |
| **Chrome** | Your actual Chrome browser | When you need your existing logins. |

| Connection | Browser | How it works |
|------------|---------|--------------|
| **MCP** | Chromium | Agent controls Chromium via MCP |
| **Extension** | Chrome | Agent connects to your Chrome via extension |

---

## Commands

| Command | Description |
|---------|-------------|
| `npx visual-browser-agent init` | Install everything |
| `npx visual-browser-agent mcp` | Start with Chromium |
| `npx visual-browser-agent mcp --extension` | Start with Chrome |
| `npx visual-browser-agent profiles` | List Chrome profiles |
| `npx visual-browser-agent doctor` | Check environment |

---

## License

MIT