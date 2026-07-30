---
title: LanceDB project knowledge search
type: entity
created: 2026-07-30
updated: 2026-07-30
tags: [lancedb, retrieval, semantic-search]
aliases: [lancedb, project-knowledge]
status: active
---

# LanceDB project knowledge search

## What it is

Local **offline semantic index** (LanceDB + sentence-transformers) over repo markdown, rules, and docs. Python sidecar scripts live in `scripts/`; index store is gitignored under `uncommitted/lancedb_project_knowledge/`.

## How it's used in this project

Agents search **before** blind grep when answering "where is X" or recalling decisions:

```bash
python3 -u scripts/search_project_knowledge_lancedb.py "<question>" --top-k 8
python3 -u scripts/index_project_knowledge_lancedb.py --apply
python3 -u scripts/index_project_knowledge_lancedb.py --apply --files AGENTS.md docs/foo.md
```

Governed by `.cursor/rules/project-knowledge-lancedb.mdc` (always applied). Optional venv: `.venv-lancedb/` + `requirements-lancedb.txt`.

## Key details

- **Adoption:** [[0001-python-sidecar-lancedb-retrieval]] — Option A from [[docs-ai-retrieval]].
- **Env:** `PROJECT_KNOWLEDGE_LANCEDB_DIR` in `.env` overrides default index path.
- **Agent duty:** re-index after editing indexed content before close-out; daily cron can rebuild overnight.
- **Retrieval order** (with SimpleMem if present): SimpleMem → LanceDB → vault → long-term memory.

## Related

- [[docs-ai-retrieval]]
- [[0001-python-sidecar-lancedb-retrieval]]
- [[documentation-in-repo]]
