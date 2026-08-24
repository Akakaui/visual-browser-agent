# Visual Browser Agent 1.0 versus Browser Use

## Executive assessment

**Visual Browser Agent and Browser Use are adjacent products, not identical products.** Browser Use sells a hosted browser-agent platform and also maintains an open-source Python agent framework. Visual Browser Agent is a local-first, TypeScript/Playwright operating layer for external coding agents: it gives Claude Code, Antigravity, Cursor, and similar clients a safe, evidence-producing way to control managed Chromium or a user’s existing Chrome session.

The strategic mistake would be to describe Visual Browser Agent as “another Browser Use.” The stronger position is:

> **Visual Browser Agent is the private, Playwright-native browser control plane for coding agents and existing Chrome identities. Browser Use is the hosted task-completion and browser-infrastructure platform for agents that need cloud scale, stealth, proxies, CAPTCHA handling, and managed persistence.**

Browser Use’s own product index separates its commercial offerings into **Browser Use Agents**—submit a task and receive completed work—and **Browser Infrastructure**—connect code or an agent to managed browsers through SDK, REST, or CDP.[^1] Its open-source library is a developer framework that runs locally or on self-managed infrastructure, while Browser Use Cloud is the managed production route.[^2] Visual Browser Agent should therefore be compared against both layers separately.

## Product models

| Dimension | Visual Browser Agent 1.0 | Browser Use Cloud SaaS | Browser Use open source / self-hosted |
|---|---|---|---|
| Primary product | Local Playwright-backed agent control plane | Hosted autonomous agents plus managed browser infrastructure | Python library and agent framework run by the developer |
| Primary user | A person or coding agent that already has an agent host | A team that wants to submit browser tasks or rent managed browsers | A developer building an agent or automation product |
| Agent relationship | The host model remains the agent; Visual Browser Agent supplies MCP tools, policy, evidence, and browser state | Browser Use can supply the hosted agent, the browser, or both | The developer supplies the application, LLM choice, runtime, and operations |
| Browser location | Local managed Chromium, existing local Chrome through extension/CDP, or controlled local CDP | Browser Use Cloud infrastructure | Local machine, customer infrastructure, or a separately managed browser |
| Main interface | MCP over local stdio, CLI, local dashboard, host wrappers | Cloud API, SDK, hosted MCP endpoint, dashboard, live session views | Python API, CLI/skills, custom tools, and direct browser configuration |
| Authentication model | Uses local Chrome profile/session or approved local storage state; no cloud profile sync is required | Cloud profiles persist cookies/local storage/login state; local profiles can be synced to cloud | Existing local profiles or developer-managed auth; cloud sync is optional and operationally separate |
| Default strength | Privacy, Playwright semantics, coding-agent interoperability, local evidence, human control | Managed scale, hosted task completion, stealth, proxy network, CAPTCHA handling, persistence | Customizability, source-level control, local execution, any supported LLM |
| Core trade-off | The user/operator owns browser installation, local connectivity, and scaling | The user accepts cloud data handling, account/API-key dependence, and usage charges | The developer owns model keys, browser operations, reliability, security, and deployment |

## Capability comparison

### 1. Agent-native interaction

Visual Browser Agent is designed as a **tool server for another coding agent**. The host discovers 57 MCP tools in the verified 1.0 protocol test, including setup, profile discovery, browser connection, inspection, Playwright actions, evidence, questions, approvals, and workflows. The host can decide whether to use clean Chromium or existing Chrome and can return the result into its own artifact UI.

Browser Use Cloud can be the agent itself. Its current V4 quickstart accepts a natural-language task through an SDK or API, starts a run, waits for completion, and returns the result. Its hosted model and browser can be selected as a single service.[^3] Browser Use Cloud also exposes an MCP endpoint with session, follow-up, status, message, profile, and task-oriented tools for coding assistants.[^4]

The open-source Browser Use library is closer to an application framework: the developer creates an `Agent`, chooses an LLM, supplies a task, and can add custom tools. Browser Use’s repository also presents Browser Harness as a coding-agent integration that connects an agent directly to a real browser through CDP and lets the agent write helpers as it works.[^5]

**Verdict:** Visual Browser Agent is stronger when the coding agent must remain the primary agent and browser operations must look like native Playwright tools. Browser Use Cloud is stronger when the user wants to submit a task to a complete hosted agent without assembling a local control plane.

### 2. Playwright fidelity and deterministic browser control

Visual Browser Agent is implemented in TypeScript on top of Playwright. Its declared MCP surface includes navigation, tabs/pages, frames, dialogs, cookies, storage-state save/restore boundaries, locator references, role-based locators, web-first assertions, network requests and URL routing, tracing, console messages, media emulation, screenshots, recordings, PDF evidence, downloads, and a confirmation-gated evaluation escape hatch. The repository’s own Playwright comparison correctly notes that this is a safe agent-facing adapter, not a replacement for Playwright Test.[^6]

Browser Use Cloud Infrastructure provides a CDP URL and supports control from Playwright, Puppeteer, or Selenium.[^1] That is powerful, but it is a hosted browser connection rather than a local Playwright-native control plane. Browser Use’s agent APIs optimize for task completion, not for preserving every deterministic test-runner concept such as fixtures, projects, retries, and local test ownership.

Browser Use open source offers deep code-level control over the agent and browser configuration, and it can use custom tools and LLM providers.[^2] Its primary abstraction is nevertheless a Python browser agent rather than a TypeScript MCP adapter whose central compatibility promise is Playwright-style interaction.

**Verdict:** Visual Browser Agent has the clearest position for coding-agent workflows that need Playwright semantics, inspectable locator/assertion behavior, and a controlled escape hatch. Browser Use is stronger when browser control is only one part of a larger autonomous task system.

### 3. Existing Chrome accounts and identity selection

Visual Browser Agent’s most distinctive end-user feature is local identity selection. It discovers friendly Chrome account labels and email metadata, supports a chooser, and keeps technical directory names such as `Profile 3` internal. Its extension is installed separately in each Chrome profile, so the user can connect Work, Personal, or another identity without uploading those sessions to a cloud service.

Browser Use Cloud uses cloud browser profiles. A profile persists cookies, local storage, and login state across cloud browsers; users create or select a profile and pass its profile ID to a run.[^7] Browser Use also documents profile sync for moving local login state into a cloud profile. This is convenient for repeated remote automation, but it changes the trust boundary: the authenticated state is used by a cloud browser.

Browser Use open source supports real browser profiles and custom browser configuration. Browser Harness is explicitly aimed at connecting an agent to the user’s real browser through CDP.[^5] The open-source route is therefore capable, but the friendly “show me Work — email and let me choose” product workflow is where Visual Browser Agent is more opinionated.

**Verdict:** Visual Browser Agent wins for privacy-sensitive local Chrome usage and a non-technical user who thinks in account names. Browser Use Cloud wins for reusable remote profiles, team access, and automations that must run away from the user’s computer.

### 4. Visual evidence and artifact delivery

Visual Browser Agent treats evidence as a product object. A screenshot, trace, recording, PDF, accessibility tree, DOM snapshot, console report, and network finding can be associated with an objective, URL, identity, actions, assertions, timestamp, run ID, and fallback path. The MCP result can contain embedded image content plus portable metadata. A UI coding agent may render the image in its artifact panel; a CLI agent can use the local evidence viewer or the metadata path.

Browser Use Cloud provides progress events, recordings, live previews, observability, workspaces, persistent input/output files, and task results.[^1] Its hosted session model is better suited to a cloud dashboard and remote live view. Browser Use’s agent APIs can also return structured output, including JSON Schema in V4.[^1]

The difference is not whether both products can show a screenshot. The difference is **where the evidence lives and who owns the review surface**. Visual Browser Agent returns evidence to the host coding agent and keeps a local dashboard fallback. Browser Use Cloud centralizes sessions, files, recordings, and observability in its service. Browser Use open source leaves the evidence architecture to the application or harness.

**Verdict:** Visual Browser Agent is stronger for host-native, local-first evidence and cross-agent portability. Browser Use Cloud is stronger for centralized remote observability and team workflows. Browser Use open source is the most flexible but requires the developer to build the review experience.

### 5. Human questions, takeover, and approvals

Visual Browser Agent distinguishes three events: a clarifying question, a human takeover for login/MFA/CAPTCHA or other secret entry, and an approval for an external or consequential action. The MCP surface includes `ask_human`, `request_approval`, `submit_public_action`, and `delete_artifacts`. The verified protocol test confirmed that an explicit `no` response is preserved as a denial rather than silently retried.

Browser Use Cloud advertises human takeover for authentication and approvals as part of its hosted product.[^1] Its cloud session model is well suited to showing a live browser that a user can take over. Browser Use open source provides the framework for custom tools and workflows, but the exact approval policy and host UI are the responsibility of the application or integration.

The industry-standard distinction is important. MCP tool results support text, images, resources, and structured content, while MCP elicitation is intended for client-mediated structured user input with review, decline, and cancellation controls.[^8] Sensitive credentials should not be collected in ordinary form input; the user should enter them directly in the browser or through an appropriate out-of-band flow.

**Verdict:** Visual Browser Agent has the clearest local policy model and coding-agent guidance. Browser Use Cloud has the strongest hosted takeover experience. Both require careful host configuration; neither should be treated as permission to automate secrets or bypass user approval.

### 6. Scale, stealth, network, and CAPTCHA

Browser Use Cloud is decisively ahead in managed browser infrastructure. Its product materials advertise hosted Chromium, stealth browser builds, managed residential proxies, proxy locations, persistent cloud profiles, live previews, and CAPTCHA handling.[^1] Its current pricing page lists browser time, proxy bandwidth, concurrency, profiles, scheduled jobs, webhooks, and other cloud-plan features.[^9]

Visual Browser Agent is intentionally local-first. It does not provide a managed proxy network, cloud browser fleet, remote concurrency service, or CAPTCHA-solving platform. It provides local Playwright browser control, controlled network routing for the active session, and local evidence. That is a feature for privacy and predictable ownership, but it is not a substitute for Browser Use’s infrastructure product.

Browser Use open source can be deployed on customer infrastructure and can connect to custom or remote browsers, but the operator must build the scaling, proxy, stealth, session management, and observability layer. Browser Use’s own open-source documentation recommends its cloud route for production scenarios where it handles agents, browsers, persistence, authentication, cookies, and LLM operations.[^2]

**Verdict:** Browser Use Cloud wins by a wide margin for high-volume, bot-sensitive, geographically distributed, or CAPTCHA-heavy automation. Visual Browser Agent wins when introducing that infrastructure would violate privacy, compliance, cost, or architecture requirements.

### 7. Pricing and operating model

Visual Browser Agent is distributed as an MIT-licensed npm package and is designed to run locally. Its direct operating costs are the user’s machine, Playwright browser runtime, chosen coding-agent/model costs, and any infrastructure the user adds. There is no Visual Browser Agent cloud account or usage meter in the local package.

Browser Use Cloud is usage-based. Its official pricing page currently lists a free tier, credit-based plans, browser time beginning at `$0.02` per browser-hour, proxy charges, concurrency tiers, profiles, scheduled jobs, webhooks, and hosted model rates.[^9] Prices and limits can change, so the account billing page remains authoritative for a purchase.

Browser Use open source is free software under MIT, but “free to install” is not “free to operate.” The developer still pays for an LLM provider or runs a local model, and production operation requires browser, compute, auth, logging, and reliability work.[^2]

**Verdict:** Visual Browser Agent is the best fit for local ownership and predictable software distribution. Browser Use Cloud is the best fit when infrastructure cost is justified by speed, scale, stealth, and a managed service. Browser Use open source is the best fit for teams that want code-level control and are willing to operate the system.

## Decision matrix by use case

| Use case | Best fit | Why |
|---|---|---|
| “Use my local Work Chrome account and inspect this internal page” | **Visual Browser Agent** | Friendly local profile chooser, extension/CDP connection, no profile upload required |
| “Have an agent complete a one-off web task with no local setup” | **Browser Use Cloud Agents** | Hosted task API and managed browser/agent experience |
| “Run thousands of browser tasks with proxies and anti-bot support” | **Browser Use Cloud Infrastructure** | Managed browser fleet, concurrency, proxy, stealth, and CAPTCHA features |
| “Generate deterministic browser tests with Playwright semantics” | **Visual Browser Agent plus raw Playwright Test** | Agent-facing Playwright adapter plus a direct escape hatch; use Playwright Test for the test runner |
| “Build a custom Python agent with my own tools and model” | **Browser Use open source** | Deep source-level control and custom tool/model integration |
| “Connect Claude Code or Antigravity to a browser and return screenshots in the host UI” | **Visual Browser Agent** | MCP tools, host wrappers, embedded image content, metadata fallback, and local evidence viewer |
| “Reuse an authenticated remote profile across scheduled cloud jobs” | **Browser Use Cloud** | Persistent cloud profiles, scheduling, webhooks, and managed sessions |
| “Keep browsing data on my workstation for compliance or privacy” | **Visual Browser Agent** | Local Chrome/Chromium and local artifacts by default |
| “Give an agent a live remote browser takeover link” | **Browser Use Cloud** | Hosted live previews and session-oriented remote infrastructure |

## Scorecard by product character

The following scores are **fit scores for the stated use case**, not objective quality scores. A high number means the product is a strong match for that requirement.

| Capability | Visual Browser Agent | Browser Use Cloud | Browser Use OSS/self-hosted |
|---|---:|---:|---:|
| Local privacy and data ownership | 9 | 4 | 8 |
| Existing local Chrome identity workflow | 9 | 6 | 8 |
| Playwright-native agent control | 9 | 7 | 8 |
| Hosted autonomous task completion | 5 | 10 | 6 |
| Cloud scaling and concurrency | 2 | 10 | 4 |
| Stealth, proxies, CAPTCHA handling | 2 | 10 | 4 |
| Coding-agent MCP onboarding | 9 | 8 | 7 |
| Host-native artifact fallback | 9 | 8 | 5 |
| Built-in local safety and approvals | 9 | 8 | 5 |
| Developer customization | 8 | 8 | 10 |
| Non-technical no-install experience | 6 | 10 | 4 |
| Operational simplicity for a local user | 8 | 9 | 4 |

## What would make Visual Browser Agent win

Visual Browser Agent should not compete on cloud scale or stealth. It should win on a sharper promise: **“Give your coding agent safe, local, Playwright-quality access to the browser you already trust, and always return evidence a human can review.”**

That promise is credible today because the repository contains the core pieces: a Playwright adapter, MCP server, friendly profile discovery, per-profile extension setup, dashboard/evidence viewer, portable image results, agent host wrappers, human questions, approval tools, and a 57-tool protocol acceptance test.

The most valuable next improvements are product polish rather than a larger feature checklist. First, make the local onboarding experience feel as effortless as Browser Use’s setup prompt: the agent should diagnose, explain, ask permission, and complete setup without requiring the user to understand MCP. Second, make artifact output a stable contract with explicit MIME type, title, objective, URL, identity, run ID, and fallback resource for every evidence-producing tool. Third, add a native client-elicitation path where MCP hosts support it, while preserving the local question fallback. Fourth, publish a real fixture-based integration suite covering tabs, frames, storage restore, network mocks, downloads, dialogs, traces, and all risky-action policies. Finally, add an optional remote execution adapter rather than turning the core product into a cloud service.

## 1.0 positioning recommendation

Use this product statement:

> **Visual Browser Agent is the local-first Playwright agent runtime for coding agents. It connects agents to clean Chromium or the user’s existing Chrome identities, exposes reliable browser controls through MCP, produces host-renderable evidence, and pauses for human input before sensitive or consequential actions.**

Do not claim that it replaces Browser Use Cloud, provides stealth browsing, solves CAPTCHAs, or scales a browser fleet. Instead, present the products as complementary:

| If the customer asks for… | Recommend |
|---|---|
| A private browser operator inside a coding-agent workflow | Visual Browser Agent |
| A managed cloud agent that completes tasks for them | Browser Use Cloud Agents |
| Hosted browsers, stealth, proxies, and scaling | Browser Use Cloud Infrastructure |
| A customizable Python agent they operate themselves | Browser Use open source |
| A local Playwright test suite | Playwright Test, optionally with Visual Browser Agent for agent-assisted exploration |

## Bottom line

**Visual Browser Agent is differentiated, but it is differentiated vertically, not universally.** It is better than Browser Use when the user values local Chrome identity access, Playwright fidelity, host-agent interoperability, evidence portability, and explicit local safety. Browser Use is better when the user values a hosted autonomous agent, remote profiles, stealth, CAPTCHA support, proxy geography, scale, and managed operations.

A fair overall conclusion is therefore not “Visual Browser Agent is better.” It is:

> **Visual Browser Agent is the better local coding-agent browser layer; Browser Use Cloud is the better managed browser-agent platform; Browser Use open source is the better starting point for a developer who wants to build and operate a custom Python agent.**

## References

[^1]: [Browser Use — Product index: Agents and Browser Infrastructure](https://browser-use.com/)
[^2]: [Browser Use — Open Source introduction and production guidance](https://docs.browser-use.com/open-source/introduction)
[^3]: [Browser Use — Cloud Agent quickstart](https://docs.browser-use.com/cloud/agent/quickstart)
[^4]: [Browser Use — Cloud MCP server](https://docs.browser-use.com/cloud/guides/mcp-server)
[^5]: [Browser Use — Browser Harness repository](https://github.com/browser-use/browser-harness)
[^6]: [Visual Browser Agent — Playwright comparison](playwright-comparison.md)
[^7]: [Browser Use — Cloud profiles and authentication](https://docs.browser-use.com/cloud/guides/authentication)
[^8]: [Model Context Protocol — Tools and user elicitation](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation)
[^9]: [Browser Use — Current pricing](https://browser-use.com/pricing)
