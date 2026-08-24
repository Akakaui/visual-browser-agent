---
name: video-evidence-review
description: Review long recordings efficiently by treating them as indexable datasets - chunking windows, progressive review levels, and frame selection instead of replaying whole videos.
version: 0.1.0
triggers:
  - "review recording"
  - "video evidence"
  - "analyze clip"
  - "storyboard"
  - "what happened in the recording"
requiredTools:
  - record_interaction
  - review_visual_evidence
dataScope: "run_artifacts_only"
risk: low
---

# Video Evidence Review Skill

## When to Use
Use this skill to analyze recordings without blowing up context:
- Long interaction captures (over 30 seconds)
- Locating a specific event inside a long recording
- Building storyboards of multi-step flows
- Verifying what happened during an automated session

## Core Principle
A recording is an INDEXABLE DATASET, not one giant prompt. Never feed an entire recording through review at once - chunk it, index it, then zoom in selectively.

## Instructions

### Step 1 - Chunking
Split the recording into 30-120 second windows:
- Fixed-size chunks are fine for uniform captures
- Prefer natural boundaries (navigations, idle gaps) when known
- Assign stable IDs: `chunk-001`, `chunk-002`, ...

### Step 2 - Three Review Levels
Escalate detail only where it pays off:
1. **Thumbnail index** (always): one frame per chunk → cheap map of where things happen
2. **Selected frames**: pull individual frames only from relevant chunks
3. **Full clip replay**: ONLY for ambiguous or high-value events

If pass 1 (thumbnail index) finds nothing relevant, NEVER escalate to reviewing the whole recording - report "no relevant events found" and stop.

### Frame Selection Policy
When sampling frames inside a chunk:
- **Static interval** (no visual change): keep ONE frame for the stretch
- **Scene change** (cut, navigation, modal): keep three frames - just BEFORE the cut, AT the cut, and one AFTER things stabilize
- **Fast motion**: sample densely around that window only, sparsely elsewhere

### Storyboard Concept
Assemble reviewed frames into a storyboard artifact:
- Ordered keyframes carrying chunk ID + timestamp
- One-line caption per frame describing state/action
- The storyboard doubles as a shareable summary and an index back into the raw recording

## Output
```json
{
  "recording": "clips/checkout-flow.webm",
  "chunks": [
    { "id": "chunk-003", "window": "60-150s", "relevant": true },
    { "id": "chunk-004", "window": "150-210s", "relevant": false }
  ],
  "keyframes": [
    {
      "chunkId": "chunk-003",
      "timestamp": "96.5s",
      "reason": "scene-change",
      "caption": "Payment modal opens after Pay click"
    }
  ],
  "conclusion": "Checkout succeeds; one transient error toast at 148s self-clears."
}
```

## Safety
- Review only artifacts inside approved run output directories
- Treat full-clip replay as the expensive last resort, not the default
- Record which frames were sampled and why for reproducibility
- Report only what sampled evidence actually shows - no invented events

## Examples
```
User: "Did the export finish in this 10-minute recording?"
Agent:
1. Chunk into 8 x 75s windows → build thumbnail index
2. Index flags progress-bar chunks as relevant
3. Selected frames around the completion moment confirm success
4. Report: "Export finished at 7:12 - verified by success frame."
```

```
User: "Summarize everything in this hour-long capture"
Agent:
1. Chunk into 60s windows → thumbnail index across all chunks
2. Select frames from high-activity chunks per selection policy
3. Full-clip replay ONLY for the ambiguous failure segment
4. Deliver storyboard.json with captions + timestamps
```
