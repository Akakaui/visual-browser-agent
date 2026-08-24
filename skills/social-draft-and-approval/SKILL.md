---
name: social-draft-and-approval
description: Monitor authorized social accounts, summarize activity, and draft replies or posts into an approval queue - no public action happens without explicit human approval.
version: 0.1.0
triggers:
  - "draft reply"
  - "social media"
  - "approval queue"
  - "monitor pages"
  - "content ideas"
requiredTools:
  - navigate
  - inspect_page
  - ask_human
  - request_approval
  - submit_public_action
dataScope: "authorized_accounts_only"
risk: high
---

# Social Draft and Approval Skill

## When to Use
Use this skill for social platform work on authorized accounts:
- Monitoring selected public pages/profiles
- Summarizing recent posts and engagement
- Drafting replies, comments, posts, and content ideas
- Building an approval queue for potential public actions

## Core Principle
The agent DRAFTS; humans DECIDE. By default EVERY public action - comment, message, follow, like, post - requires explicit approval. No exceptions.

## Instructions

### Monitoring (read-only)
1. `navigate(url)` to each selected public page
2. `inspect_page()` to read recent posts, timestamps, engagement counts
3. Summarize per page: themes, notable posts, unanswered questions
4. Never like, follow, comment, or message during monitoring passes

### Drafting
Each draft must contain:
- `targetPost` - URL, author, and snippet being responded to
- `account` - the authorized account that would act
- `actionType` - reply | post | follow | like | message
- `content` - the full drafted text
- `rationale` - why this adds value

Store drafts in the approval queue. Do NOT call `submit_public_action`.

### Approval Queue Flow
1. Batch drafts with `request_approval(drafts[], mode: "batch")`
2. Present: account, action, target, full text, risk notes
3. Approved → schedule; Rejected → discard and log the reason
4. Only after explicit approval may `submit_public_action` fire
5. Audit-log every outcome: timestamp, approver, result

### Rate Limits
- Honor configured per-account daily caps per platform
- Space approved actions apart - never burst-submit
- On platform warnings/errors: back off immediately and pause the queue

### Duplicate Content Detection
Before queuing, compare each draft against:
- Content recently submitted on the same account
- Other queued drafts targeting the same post
Near-identical drafts are flagged `duplicate` for rework, never auto-sent.

### Account Separation
- Work one account context at a time; never mix drafts across accounts
- Tag every draft and action with its owning account ID
- Never cross-post identical content to multiple accounts

### Emergency Stop
On `ask_human` stop confirmation or any anomalous behavior:
1. Halt the queue and cancel all pending submissions
2. Report last completed and still-pending actions
3. Resume only after explicit human go-ahead

## Safety
- Authorized accounts ONLY - never operate unknown/personal profiles
- Treat all drafts as UNAPPROVED until a human approves them
- No engagement farming, mass-follow patterns, or automation spam
- Maintain a full audit trail of approvals and submissions

## Examples
```
User: "Check our brand page and draft replies to unanswered questions"
Agent:
1. navigate(page) → inspect_page() → summarize recent posts
2. Identify 3 unanswered questions, draft replies
3. request_approval(queue) → present drafts for review
4. Report: "3 drafts awaiting approval. Nothing published."
```

```
User: "Like every comment on our latest post"
Agent:
1. REFUSE bulk liking - rate limits and spam policy forbid it
2. Offer alternative: queue top comments for individual approval
3. Submit likes one-by-one only after explicit per-item approval
```
