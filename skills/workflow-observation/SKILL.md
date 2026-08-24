---
name: workflow-observation
description: Observe a multi-step web workflow without changing real state - record short clips per stage, extract a step-by-step map, and identify confusing or failure-prone stages.
version: 0.1.0
triggers:
  - "observe workflow"
  - "map user flow"
  - "walkthrough"
  - "checkout flow"
  - "ux walkthrough"
requiredTools:
  - navigate
  - click
  - fill
  - record_interaction
  - capture_screenshot
dataScope: "active_tab_only"
risk: low
---

# Workflow Observation Skill

## When to Use
Use this skill to understand how a workflow behaves end to end:
- Onboarding, signup, search, cart, or checkout flows
- Multi-step forms and wizards
- Documenting a flow before redesign or test automation
- Finding confusing or failure-prone stages in a UX walkthrough

## Instructions

### Preparation
1. Confirm the environment with the user: production data vs sandbox/test account
2. State the contract up front: observe and map, never transact
3. Break the workflow into named stages (e.g., landing -> search -> detail -> cart -> checkout)

### Stage Recording
For each stage:
1. `record_interaction(action: "start")` before the first step of the stage
2. Perform minimal steps (`click`, `fill`) needed to progress
3. Keep clips short: stop after the stage completes (max ~15 seconds)
4. `capture_screenshot` at every decision point and state change

### Step Extraction
From clips and screenshots, produce a numbered step map:
- Each entry: action taken -> expected result -> evidence ID (clip/screenshot)
- Mark branches, optional paths, back-navigation, and dead ends
- Note wait states, spinners, and redirects between steps

### Friction Identification
Flag stages that are:
- **Confusing**: ambiguous labels, hidden primary actions, unexpected navigation, jargon
- **Failure-prone**: validation appearing only at the end, destructive actions adjacent to safe ones, no undo, vague error messages, lost input on back-navigation

Each flagged stage cites the clip timestamp or screenshot that shows the problem.

### Hard Boundaries
- NEVER submit final forms (order placement, payment, account changes, publishing, deletion) without explicit user approval for that exact action
- Fill only clearly test-safe fields; use obvious placeholder values ("Test User", "test@example.invalid")
- If a stage cannot be observed safely, record it as UNOBSERVED rather than forcing through it

## Safety
- Observation mode only: no purchases, submissions, or state-mutating confirmations
- Prefer sandbox/staging environments; ask when unsure which environment you are in
- Do not enter real personal data, payment details, or credentials into observed flows
- Stop immediately if an action would create legal or financial obligations

## Examples
```
User: "Map our signup flow and tell me where people might drop off"
Agent:
1. navigate(signup) -> record_interaction(start)
2. fill each field with placeholder data, click continue per step
3. record_interaction(stop), capture_screenshot each step
4. Output numbered step map + friction flags (e.g., password rules revealed only on error)
```

```
User: "Watch how checkout works on staging, don't buy anything"
Agent:
1. Walk cart -> address -> payment pages, recording short clips per stage
2. At final "Place Order" step: STOP, mark stage UNOBSERVED
3. Report: full step map, friction notes, explicit note that no order was placed
```
