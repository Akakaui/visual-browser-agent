---
name: retention-cleanup
description: Manage artifact retention, cleanup expired files, and enforce storage limits per configuration.
version: 0.1.0
triggers:
  - "cleanup"
  - "retention"
  - "delete old"
  - "storage"
  - "disk space"
requiredTools:
  - delete_artifacts
dataScope: "approved_directories_only"
risk: medium
---

# Retention Cleanup Skill

## When to Use
Use this skill for artifact lifecycle management:
- Clean up expired screenshots/recordings/reports
- Enforce per-run size limits
- Free disk space
- Compliance with data retention policies

## Instructions

### Automatic Cleanup
Configured via `retention` config:
- `rawVideoDays: 3` - Delete recordings older than 3 days
- `screenshotsDays: 14` - Delete screenshots older than 14 days
- `reportsDays: 90` - Delete reports older than 90 days
- `maxRunSizeMb: 500` - Max size per run
- `deleteExpiredAutomatically: true` - Run on schedule

### Manual Cleanup
1. Call `delete_artifacts(paths[], confirm: true)` for specific files
2. Or use retention manager directly for bulk operations

### Run Size Enforcement
When adding artifacts to a run:
1. Check `getRunSize(runId)`
2. If > `maxRunSizeMb`, delete oldest artifacts in that run until under limit

### Retention Policies by Type
| Type | Default Retention | Use Case |
|------|-------------------|----------|
| Recordings | 3 days | Large, transient, for debugging |
| Screenshots | 14 days | Medium, reference for reports |
| Reports | 90 days | Small, long-term reference |

### Safety
- **Never** delete outside `approvedDirectories`
- **Always** require `confirm: true` for manual deletion
- Log all deletions with timestamp, reason, file list
- Respect `uploadArtifactsByDefault: false` - don't auto-upload

## Commands
```
# Automatic (runs on init and periodically)
retentionManager.cleanup()

# Manual specific files
delete_artifacts(["runs/screenshots/old.png", "runs/recordings/old.webm"], true)

# Check run size
retentionManager.getRunSize("run-123")

# Enforce limit
retentionManager.enforceRunSizeLimit("run-123")
```

## Integration
- Called automatically after each run completes
- Hooked into `capture_screenshot` and `record_interaction` via event listeners
- Reports deleted artifacts in run summary

## Examples
```
User: "Clean up old recordings from last week"
Agent:
1. retentionManager.cleanup() → returns count deleted
2. Report: "Deleted 47 recordings older than 3 days"
```

```
User: "Delete all artifacts from run-abc123"
Agent:
1. Get artifacts for run-abc123
2. delete_artifacts(paths, confirm: true)
3. Report: "Deleted 12 artifacts from run-abc123"
```