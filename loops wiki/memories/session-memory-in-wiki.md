---
title: Session memory in the wiki
type: guide
created: 2026-07-30
updated: 2026-07-30
tags: [memory, session, continuity]
status: active
---

# Session memory in the wiki

## What lives where

| Location | Role |
|----------|------|
| **`AI_SESSION_MEMORY.md`** (repo root) | **Dated session log** — AI appends at close-out. Format: shipped, decisions, state, blocked/next. Newest on top. |
| **`MEMORY.md`** (repo root) | **Rolling summary** — two sections only (`Current session`, `Previous session`). Overwrite, don't append. |
| **`loops wiki/`** | **Compiled long-form knowledge** — entities, concepts, ADRs, ingested sources. Updated when decisions stabilize or docs are ingested. |

## How they relate

- **Session memory** = breadcrumbs for the *next* agent turn in this repo ("what just happened").
- **Wiki** = durable reference ("how loops works", "what we decided about retrieval").
- Do **not** duplicate every session entry into the vault — file wiki pages when a decision or system description outgrows a single log line.

## Agent close-out checklist

1. Append entry to `AI_SESSION_MEMORY.md`
2. Update `MEMORY.md` (current → previous, write new current)
3. If docs or decisions changed: update wiki pages + `index.md` + `log.md`
4. Re-index LanceDB if indexed files changed — [[lancedb-project-knowledge]]

## Privacy

No secrets, tokens, passwords, or PII in any memory file or wiki page.

## Related

- [[documentation-in-repo]]
- [[SCHEMA]]
- [[0001-python-sidecar-lancedb-retrieval]]
