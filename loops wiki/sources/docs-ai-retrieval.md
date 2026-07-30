---
title: docs/ai-retrieval.md (ingested)
type: source
created: 2026-07-30
updated: 2026-07-30
tags: [retrieval, lancedb, docs]
aliases: [ai-retrieval]
sources: ["docs/ai-retrieval.md"]
status: active
---

# docs/ai-retrieval.md (ingested)

Compiled from **`docs/ai-retrieval.md`**. This repo is **not Python-native** at the top level, so semantic search uses a sidecar pattern rather than in-app runtime embedding.

## Key points

- **Option A (recommended):** Python sidecar with `scripts/*_project_knowledge_lancedb.py` + `.venv-lancedb` — matches other repos.
- **Option B:** Cross-repo vault recall (ghembed) when centrally indexed.
- **Option C:** Platform-native retrieval (Honcho, session search) — avoid a third index when redundant.
- **This repo adopted Option A** — see [[0001-python-sidecar-lancedb-retrieval]] and [[lancedb-project-knowledge]].

## Detailed notes

### Option A — Python sidecar

```bash
python3 -m venv .venv-lancedb
.venv-lancedb/bin/pip install -r requirements-lancedb.txt
.venv-lancedb/bin/python -u scripts/index_project_knowledge_lancedb.py --apply
.venv-lancedb/bin/python -u scripts/search_project_knowledge_lancedb.py "<question>"
```

Add `.venv-lancedb/` and `uncommitted/` to `.gitignore`. Index store defaults to `uncommitted/lancedb_project_knowledge/`.

### Option B — vault recall

If ghembed / vault recall is available, committed markdown may already be indexed centrally — query vault instead of per-repo index.

### Option C — platform retrieval

Prefer Hermes Honcho + session search when the agent platform already provides retrieval.

## Entities mentioned

- [[lancedb-project-knowledge]]

## Concepts discussed

- Pre-task retrieval order (SimpleMem → LanceDB → vault → long-term memory)

## Related

- [[0001-python-sidecar-lancedb-retrieval]]
- [[documentation-in-repo]]
