---
title: my-robot (companion bootstrap)
type: entity
summary: Sibling repo that bootstraps the verify gate, memory files, search and wiki that loops assumes.
created: 2026-07-30
updated: 2026-10-19
last_verified: 2026-10-19
tags: [my-robot, bootstrap, companion]
aliases: [my-robot]
status: active
sources: []
---

# my-robot (companion bootstrap)

## What it is

Sibling repository **[noidsoup/my-robot](https://github.com/noidsoup/my-robot)** — an installer that clones a 7-layer AI-first development foundation into any repo via `bootstrap.sh` + `template/`.

## How it's used in this project

README positions loops as the **methodology** and my-robot as the **foundation** loops runs on:

- Verify gate (`.verify.sh`)
- Memory files (`AI_SESSION_MEMORY.md`, `MEMORY.md`)
- Semantic search scaffold (LanceDB scripts)
- Obsidian LLM wiki (now `wiki/` at the repo root; installs before 2026-10-19 used `<repo> wiki/`)
- Agent rules — and **symlinks loops in automatically**

## Key details

- **Relationship:** install my-robot into a target repo → get wiki + memory + verify + loops awareness without separate loops setup.
- **This repo** is loops itself — it carries its own wiki (`wiki/`) and adopted LanceDB sidecar independently.
- **Template source:** the first schema came from my-robot's `template/wiki/SCHEMA.md`. Since 2026-10-19 the wiki follows the shared standard in `~/.claude/skills/closeout/wiki-template/` (see [[SCHEMA]]).

## Related

- [[readme-project-overview]]
- [[documentation-in-repo]]
- [[lancedb-project-knowledge]]
