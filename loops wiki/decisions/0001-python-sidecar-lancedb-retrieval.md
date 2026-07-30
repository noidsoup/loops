---
title: Python sidecar LanceDB for retrieval
type: decision
created: 2026-07-30
updated: 2026-07-30
tags: [adr, lancedb, retrieval]
aliases: [0001]
status: active
---

# Python sidecar LanceDB for retrieval

## Status

**Accepted** — scripts, requirements, always-on rule, and gitignored index store are in the repo.

## Context

loops is a **Node.js** repo (emit, install-global, tests). Standard my-robot LanceDB scaffold is Python-native. Agents need semantic recall over markdown and rules without reading the entire tree each session.

Options documented in [[docs-ai-retrieval]]:

- **A:** Python sidecar (venv + scripts reading repo markdown only)
- **B:** Cross-repo vault recall (ghembed)
- **C:** Platform-native retrieval only (Honcho, etc.)

## Decision

Adopt **Option A — Python sidecar** for per-repo semantic search:

- `scripts/search_project_knowledge_lancedb.py`
- `scripts/index_project_knowledge_lancedb.py`
- `scripts/project_knowledge_lancedb_common.py`
- `requirements-lancedb.txt`
- `.cursor/rules/project-knowledge-lancedb.mdc`
- Index at `uncommitted/lancedb_project_knowledge/` (gitignored)

Vault recall and platform memory remain valid **fallbacks** in the retrieval order but do not replace the local index on machines that run the sidecar.

## Consequences

- **Positive:** Consistent with apfs-database, marketing, field-herper pattern; works offline; cheap pre-task search.
- **Positive:** Scripts do not need to run in Node runtime — read-only markdown ingestion.
- **Negative:** Requires Python venv setup on first use; index must be rebuilt after doc edits.
- **Operational:** `npm run verify` does not require LanceDB; indexing is agent responsibility at close-out.

## Related

- [[lancedb-project-knowledge]]
- [[docs-ai-retrieval]]
- [[documentation-in-repo]]
