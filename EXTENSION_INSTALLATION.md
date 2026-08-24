# Chrome Extension Installation Guide

Visual Browser Agent can use a signed-in Chrome profile through the **Visual Browser Agent Bridge** extension. This is useful when a coding agent needs access to an existing account, cookies, open tabs, or a website session that should not be copied into a clean browser.

> The extension is installed separately inside each Chrome profile. Installing it in your Personal profile does not install it in Work or any other profile.

## Normal-user flow

A normal user should not need to run commands after a technical installer or coding agent has configured the project. In the coding-agent chat, say:

```text
Install Visual Browser Agent and help me connect my current Chrome account. Ask before changing browser settings.
```

The agent checks setup status and tells you when a manual Chrome step is required. Follow the steps below once for each Chrome identity you want the agent to use.

## Install the extension in one Chrome profile

### 1. Open the desired Chrome identity

Open Chrome and click the profile button in the top-right. Select the identity you want to connect, such as **favour**, **Akaka**, **Ojiaku**, or **quantovest**. Confirm that the correct account is shown before installing the extension.

### 2. Open Chrome Extensions

In that same Chrome window, open:

```text
chrome://extensions/
```

Turn on **Developer mode** using the switch in the top-right corner.

### 3. Load the Visual Browser Agent extension

Click **Load unpacked**. Select the `browser-extension` folder from the Visual Browser Agent project.

If the project was cloned from GitHub, select:

```text
visual-browser-agent/browser-extension
```

If the package was installed globally, select the package’s `browser-extension` directory. If it is not present in the installed package, use the repository checkout or ask the coding agent to locate the extension directory.

### 4. Pin and verify it

Click the puzzle-piece Extensions button in Chrome, find **Visual Browser Agent Bridge**, and click the pin icon. Click the extension icon once. The extension badge should show **ON** when the local Visual Browser Agent bridge is available.

If the badge is blank, the extension is installed but is not connected to the local agent bridge yet. Keep this Chrome profile open and ask your coding agent:

```text
Check whether my current Chrome profile is connected to Visual Browser Agent and tell me how to repair it if not.
```

### 5. Repeat for other identities

Switch to another Chrome identity and repeat the installation. Each profile has its own extensions, permissions, cookies, tabs, and signed-in accounts.

## Using the connected account from chat

Once the desired profile is open and connected, use ordinary language:

```text
Use my current Chrome account to open the dashboard and take a screenshot.
```

If several identities are available, say:

```text
Show me the Chrome accounts available to Visual Browser Agent.
```

The coding agent should call `browser_profiles`, show friendly names and email addresses, and ask you to choose. You can answer:

```text
Use favour.
```

The agent should not require you to know `Default`, `Profile 2`, or `Profile 3`.

## Chrome versus clean Chromium

Use **existing Chrome** when you need an existing login, account, cookie, or open tab. Use **clean Chromium** when visiting public websites, running repeatable QA, researching, or keeping personal accounts isolated. If you simply say “use the browser,” Visual Browser Agent chooses automatically: it uses a detectable connected Chrome session when available and otherwise opens managed Chromium.

## Troubleshooting

| Problem | Fix |
|---|---|
| The extension does not appear | Confirm Developer mode is on and that the selected folder contains `manifest.json` and `background.js`. Reload the extension. |
| The extension badge is blank | Keep the selected Chrome profile open, make sure the local MCP bridge is running, then ask the coding agent to run its browser diagnostics. |
| The wrong account is used | Switch Chrome to the intended profile first, then ask the agent to list available identities and choose the friendly account name. |
| A profile is missing | Open that profile once in Chrome, sign in if needed, then reload `chrome://extensions/` and install the extension in that profile. |
| Chrome blocks the extension | Use the unpacked-extension flow only on a machine you trust. Do not disable Chrome security protections. |
| A login or password is requested | The agent must ask you to take over or enter it yourself. Do not place passwords or one-time codes in agent prompts. |
| The agent can list profiles but cannot control one | Profile metadata is readable locally, but control requires the extension connection or an approved remote-debugging session. |

## Technical notes

The extension uses Manifest V3 and a local WebSocket bridge on port `9333`. It is intentionally local-first. The user must explicitly load it in each Chrome profile. The bridge should never be exposed to the public internet.

For technical users, the equivalent commands are:

```bash
npx visual-browser-agent doctor
npx visual-browser-agent dashboard
npx visual-browser-agent mcp --extension
```

The coding-agent route is preferred for normal users because it can perform setup diagnostics, explain the next step, and request confirmation without requiring the user to understand the command line.
