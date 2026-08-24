# Visual Browser Agent 2.0 Release Readiness

## Verdict

The project is **technically credible as an early public alpha**, but I would not present it as a fully polished production product yet. The core idea is strong: it uses Playwright for browser execution and adds an agent control plane with MCP, visual evidence, approval gates, Chrome identity handling, coding-agent wrappers, and business workflows.

The current branch builds, passes its smoke tests, starts the MCP server, connects to managed Chromium, generates locator references, performs assertions, and records traces. The release risk is now less about whether the prototype works and more about whether a new user can understand it, install it, recover from errors, and trust what the agent is allowed to do.

## Priority polish before a wider release

| Priority | Improvement | Why it matters | Suggested release target |
|---|---|---|---|
| P0 | Add a first-run wizard or desktop-friendly launcher | `npm`, MCP, extension mode, remote debugging, and Chrome profiles are too many concepts for a non-technical user | Before public launch |
| P0 | Add a real profile chooser that displays account name, email, avatar where available, and “currently open” state | Users think in terms of “Work” or “Personal,” not `Profile 3` | Before public launch |
| P0 | Make extension mode self-diagnosing | Show whether the extension is installed, which profile is connected, which tab is active, and how to repair the connection | Before public launch |
| P0 | Add stronger action confirmation UX | Before send, purchase, publish, delete, submit, or external data changes, show the exact site, action, and visible target | Before public launch |
| P1 | Add integration tests with a local fixture website | Three smoke tests do not protect the MCP surface or browser workflows from regressions | Before 1.0 |
| P1 | Add role/name locator generation and frame-targeted actions | This is central to reliable agent use and is a major part of Playwright’s agent ergonomics | Before 1.0 |
| P1 | Add storage-state restore, popup/download result objects, response-level network controls, and device profiles | These are common Playwright workflows that coding agents will expect | Before 1.0 |
| P1 | Improve error messages and recovery | Every error should say what happened, why, and the one next command or prompt that repairs it | Before 1.0 |
| P2 | Add an evidence viewer or HTML run report | Screenshots, traces, console events, and network evidence should be reviewable without opening folders manually | Before 1.0 |
| P2 | Add telemetry only with explicit opt-in, or clearly state that the product is local-only | Trust is a differentiator; users should know whether any browsing data leaves the machine | Before 1.0 |
| P2 | Remove lint warnings and add release automation | A clean quality gate increases confidence for other coding agents and npm users | Before 1.0 |

## Day-to-day user experience

### One-time setup

A technical administrator installs Node.js, runs `npm install`, builds the package, runs `npx visual-browser-agent init --mode chromium`, and installs the wrapper for the chosen coding agent with `npx visual-browser-agent host <agent>`. The coding agent is restarted once so it loads the MCP configuration.

For a non-technical user, this should eventually be packaged as a one-click installer or a small setup application. The setup should ask one question: “Do you want a clean browser, or an existing signed-in Chrome account?” The answer should configure the default mode and leave the user with a “Start browser agent” shortcut.

### Public websites and clean Chromium

The user says: “Use a clean Chromium browser. Research this website, compare desktop and mobile layouts, and save visual evidence.” The coding agent selects the Visual Browser Agent MCP server, connects to managed Chromium, performs read-only navigation and inspection, captures evidence, and returns a report.

This is the safest default because it does not expose the user’s personal cookies or signed-in sessions.

### Existing signed-in Chrome

The user opens Chrome normally, chooses the desired signed-in identity from Chrome’s own profile picker, and keeps that profile open. The extension is installed once inside each Chrome profile that will be used in extension mode. The user then tells the coding agent: “Use my Work account that is currently open in Chrome.”

The agent should inspect the connected profiles and show a friendly list such as “Work — work@example.com” and “Personal — personal@example.com.” The user selects one by number or by visible account label. The underlying directory name is never shown unless troubleshooting is necessary.

### Human approval

Read-only inspection, screenshots, accessibility snapshots, and visual audits can run automatically. The agent should pause and request approval before typing or submitting sensitive data, sending a message, purchasing, publishing, deleting, changing account settings, or making an irreversible external change. The approval should identify the domain, target control, proposed data, and consequence.

## npm publication checklist

The current package has a valid name, version, build entry point, CLI binary, `files` allowlist, MIT license declaration, build script, test script, and `prepublishOnly` quality gate. Before publishing, I recommend adding an actual `LICENSE` file, filling in the `author` field, and adding `repository`, `homepage`, and `bugs` metadata to `package.json`. A `CHANGELOG.md` and release tag are also recommended.

Run the following commands from the repository root:

```bash
npm install
npm run lint
npm run build
npm test
npm pack --dry-run
npm install /absolute/path/to/visual-browser-agent
node ./bin/visual-browser-agent.js doctor
```

`npm pack --dry-run` is important because it shows exactly what would be included in the tarball. The current package allowlist includes `dist`, `bin`, `skills`, and `wrappers`, which is good, but the dry-run output should be inspected for secrets, generated artifacts, local paths, test data, and unnecessary files. npm documents that `npm publish --dry-run` and `npm pack --dry-run` can be used to preview publication contents.[1]

Log in to npm using an account that owns the package name:

```bash
npm login
npm whoami
npm view visual-browser-agent
```

For the first public release of the unscoped package, publish interactively:

```bash
npm publish --access public
```

The exact `name` and `version` combination cannot be reused after publication, even if the package is later removed, so verify the version before publishing.[1] New packages and package-setting changes require two-factor authentication or an appropriately configured granular access token.[3]

After publication, verify installation from a clean directory:

```bash
mkdir /tmp/vba-install-check
cd /tmp/vba-install-check
npm init -y
npm install visual-browser-agent
npx visual-browser-agent doctor
npx visual-browser-agent --help
```

For future releases, update the version rather than publishing the same version again:

```bash
npm version patch   # bug fix
npm version minor   # backward-compatible feature
npm version major   # breaking change
npm publish
```

For a scoped package such as `@akakaui/visual-browser-agent`, the first public release must use `npm publish --access public`.[2] For automated GitHub Actions publishing, prefer npm trusted publishing/provenance rather than storing a long-lived token when the repository and workflow are configured for it.[1] [3]

## Recommended release sequence

I recommend releasing this project in three stages. First, publish `0.2.0-alpha.1` to a small group of coding-agent users and ask them to test clean Chromium, existing Chrome, multiple profiles, approval gates, and recovery from connection failures. Second, add integration tests and a basic connection/profile UI, then publish `0.2.0-beta.1`. Third, after the profile and safety UX are proven, publish `1.0.0` with a compatibility matrix that states exactly which Playwright features, browser engines, and coding-agent hosts are supported.

## References

[1]: https://docs.npmjs.com/cli/v12/commands/npm-publish/ "npm publish command documentation"
[2]: https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/ "Creating and publishing scoped public packages"
[3]: https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification/ "npm two-factor authentication and trusted publishing guidance"
