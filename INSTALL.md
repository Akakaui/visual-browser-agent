# How to Install Visual Browser Agent

## For You (Simple Instructions)

Just tell your AI agent:

> "Install visual-browser-agent from https://github.com/Akakaui/visual-browser-agent and use it to [your task]"

Your agent will handle everything automatically.

---

## Example Tasks

### Research a website
> "Install visual-browser-agent from https://github.com/Akakaui/visual-browser-agent and research this website's design"

### Check Facebook
> "Install visual-browser-agent from https://github.com/Akakaui/visual-browser-agent and check my Facebook"

### Take screenshots
> "Install visual-browser-agent from https://github.com/Akakaui/visual-browser-agent and take screenshots of this website"

---

## What Your Agent Will Do

1. Clone the repo from GitHub
2. Install all dependencies
3. Build the project
4. Install Chromium (browser)
5. Set up MCP configuration
6. Install skills
7. Start using the browser

You don't need to do anything technical.

---

## If Something Goes Wrong

Ask your agent:

> "Run npx visual-browser-agent doctor to check the environment"

This will show what's working and what needs fixing.

---

## Quick Reference

| What you want | What to say to your agent |
|---------------|---------------------------|
| Install and use | "Install visual-browser-agent from https://github.com/Akakaui/visual-browser-agent and use it to [task]" |
| Check if it's working | "Run npx visual-browser-agent doctor" |
| List Chrome profiles | "Run npx visual-browser-agent profiles" |
| Use Chrome instead of Chromium | "Use npx visual-browser-agent mcp --extension" |