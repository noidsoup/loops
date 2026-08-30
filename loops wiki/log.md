---
title: Wiki Log
type: log
created: 2026-07-30
updated: 2026-08-29
---

# Wiki Log

> Chronological record of wiki operations. Append-only.
>
> Format: `## [YYYY-MM-DD] verb | Subject`
>
> Verbs: `ingest`, `query`, `lint`, `update`, `create`, `migrate`, `session`
>
> Parseable: `grep "^## \[" log.md | tail -10`

## [2026-08-29] update | self-improve loop (L6 conductor) added

- Commit `adf9b47` `feat: add self-improve loop (L6 harness health conductor)`.
- Created entity [[self-improve]] from `loops/self-improve/loop.md` + `loop.yaml` (v0.1.0): O-I-V-R-M pipeline, bridge-log signal kinds, tiered apply (T1/T2/T3), prove gates.
- Updated [[loop-catalog]]: ten → eleven playbooks; added `self-improve` row.
- Updated [[loops-dispatcher]]: routing signal row + Related link for `self-improve`.
- Catalog now 11 loops + dispatcher; README routing table and index refreshed accordingly.

## [2026-07-30] create | Initial loops wiki bootstrap

- Created vault at **`loops wiki/`** with SCHEMA, index, log, Obsidian config.
- Ingested **README.md** → [[readme-project-overview]]; **docs/ai-retrieval.md** → [[docs-ai-retrieval]].
- Derived entities: [[loops-dispatcher]], [[adapters-emit-and-install-global]], [[model-classes]], [[lancedb-project-knowledge]], [[my-robot-companion]].
- Derived concepts: [[self-correcting-contract]], [[loop-catalog]], [[loop-personas]].
- Derived guides: [[global-install-and-update]], [[per-project-install]], [[documentation-in-repo]].
- ADR: [[0001-python-sidecar-lancedb-retrieval]] (LanceDB sidecar adopted; scripts + rule in repo).
- Memories: [[session-memory-in-wiki]].
- Added repo pointer **WIKI.md** and **`.cursor/rules/llm-wiki.mdc`**.
- Original **`docs/`** files unchanged.
