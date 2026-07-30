---
title: my-robot (companion bootstrap)
type: entity
created: 2026-07-30
updated: 2026-07-30
tags: [my-robot, bootstrap, companion]
aliases: [my-robot]
status: active
---

# my-robot (companion bootstrap)

## What it is

Sibling repository **[noidsoup/my-robot](https://github.com/noidsoup/my-robot)** — an installer that clones a 7-layer AI-first development foundation into any repo via `bootstrap.sh` + `template/`.

## How it's used in this project

README positions loops as the **methodology** and my-robot as the **foundation** loops runs on:

- Verify gate (`.verify.sh`)
- Memory files (`AI_SESSION_MEMORY.md`, `MEMORY.md`)
- Semantic search scaffold (LanceDB scripts)
- Obsidian LLM wiki (`<repo> wiki/`)
- Agent rules — and **symlinks loops in automatically**

## Key details

- **Relationship:** install my-robot into a target repo → get wiki + memory + verify + loops awareness without separate loops setup.
- **This repo** is loops itself — it carries its own wiki (`loops wiki/`) and adopted LanceDB sidecar independently.
- **Template source:** my-robot's `template/wiki/SCHEMA.md` informed this vault's schema conventions.

## Related

- [[readme-project-overview]]
- [[documentation-in-repo]]
- [[lancedb-project-knowledge]]
