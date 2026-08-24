---
name: artifact-retention
description: Enforce default retention periods for run artifacts with content-addressed storage, user keep/export marks, and cleanup that never deletes user-exported files.
version: 0.1.0
triggers:
  - "retention"
  - "artifact lifecycle"
  - "cleanup policy"
  - "storage tiers"
  - "keep artifact"
requiredTools:
  - delete_artifacts
dataScope: "approved_directories_only"
risk: medium
---

# Artifact Retention Skill

## When to Use
Use this skill for lifecycle management of run artifacts:
- Applying default retention periods per artifact type
- Deduplicating stored frames and clips
- Honoring user keep/export/delete-run decisions
- Running manual or scheduled cleanup safely

## Retention Defaults
| Type | Retention | Notes |
|------|-----------|-------|
| raw_recordings | temporary | Deleted when the run closes unless promoted |
| selected_clips | 7 days | Promoted segments worth keeping short-term |
| screenshots | 14 days | Reference material backing reports |
| reports | 90 days | Final deliverables |
| exported | user-controlled | NEVER touched by cleanup |

Once a user exports an artifact, ownership transfers to them - it leaves the retention system permanently.

## Instructions

### Content-Addressed Storage
Store every frame/clip by the hash of its bytes:
1. Compute `sha256(content)` before writing
2. Blob path = `store/<hash-prefix>/<hash>` - identical frames stored ONCE
3. Artifacts reference blobs by hash; check refcount before any delete
4. Delete a blob only when its refcount reaches zero

### User Marks
Three marks give users control over lifecycle:
- `keep` - exempt from expiry until the mark is removed
- `export` - copies the artifact out; the exported copy is permanently protected
- `delete-run` - schedules removal of a run EXCEPT kept and exported artifacts

### Cleanup Algorithm
1. List artifacts past their retention deadline
2. Skip anything carrying a `keep` mark
3. Skip anything referenced by an exported bundle
4. Decrement refcounts; delete only fully unreferenced blobs
5. Log timestamp, reason, artifact list, and freed space

### Manual Deletion
Manual deletes ALWAYS require explicit confirmation:
`delete_artifacts(paths[], confirm: true)`
Without `confirm: true`: refuse and show exactly what WOULD be deleted.

## Hard Rules
- Cleanup must NEVER delete user-exported artifacts
- Manual deletion without `confirm: true` is forbidden
- `delete-run` preserves `keep`-marked and exported artifacts
- Deletion operates only within approved directories

## Safety
- Dry-run first whenever more than 50 files are affected
- Log every deletion with reason and freed-space totals
- Ownership ambiguous? KEEP the artifact and ask the user
- Fail closed on refcount errors - a shared blob surviving beats data loss

## Examples
```
User: "Run weekly cleanup"
Agent:
1. List artifacts past deadline (closed raw_recordings, expired clips/screenshots/reports)
2. Skip kept and exported artifacts; decrement refcounts
3. Show summary → delete_artifacts(paths, confirm: true)
4. Report: "Removed 132 artifacts, freed 1.8 GB, 4 kept, 9 exports protected."
```

```
User: "Delete everything from run-abc123"
Agent:
1. Inventory run-abc123 artifacts and marks
2. Detect 2 exported bundles + 1 keep mark → exclude them
3. Present plan → delete_artifacts(remaining paths, confirm: true)
4. Report deletions; exported artifacts untouched
```
