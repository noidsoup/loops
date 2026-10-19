---
description: Project wiki — read wiki/SCHEMA.md before any wiki operation
paths:
  - "wiki/**"
---

# Project wiki

The project wiki is `wiki/` (standard layout; it was `loops wiki/` before 2026-10-19).

Before creating, updating, or querying wiki pages, read `wiki/SCHEMA.md`. Pages use `[[wikilinks]]` and YAML frontmatter.

Lint before committing wiki changes: `python3 ~/.claude/skills/closeout/wiki-template/wiki_lint.py .`

After significant work, file lasting decisions in `wiki/decisions/` and new traps in `wiki/gotchas.md`, then add a line to `wiki/log.md`.
