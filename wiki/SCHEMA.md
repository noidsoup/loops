---
title: Wiki schema
type: overview
summary: How to write in this wiki. Read before editing any page.
status: active
created: 2026-10-19
updated: 2026-10-19
last_verified: 2026-10-19
sources: [~/.claude/skills/closeout/wiki-template/SCHEMA.md]
tags: [meta]
---

# Wiki schema — loops

This wiki is the project's compiled knowledge, maintained by AI agents. Standard: <https://claude.ai/artifact/RnB3P1rsrghZQoic5o6FXC>.

## What goes here (and what doesn't)

- **Here:** what the project is and for whom, environments, people and roles, how systems connect, decisions and why, gotchas with history, digests of outside sources (Loom, Notion, email, PR series).
- **Not here:** rules every session needs (→ `AGENTS.md`/`CLAUDE.md`), procedures people edit (→ `docs/`, runbooks; link them), live state and to-dos (→ `FOLLOWUPS.md`/`TASKS.md`), session journal (→ `AI_SESSION_MEMORY.md`), facts about Nicholas (→ Honcho).
- Only write what an agent couldn't learn by reading the code. No codebase tours.

## Layout

```
wiki/
├── SCHEMA.md     this file
├── index.md      "Must know" block + one line per page (≤150 lines)
├── log.md        append-only, newest last (≤150 entries; older → log/YYYY.md)
├── overview.md   what, who, where it runs, environments, key links
├── gotchas.md    short scar-tissue list; each item links to detail
├── entities/     systems, services, sites, people/roles, environments
├── concepts/     how things work and fit together
├── decisions/    0001-short-name.md — what, why, alternatives, status
├── guides/       how-tos not already in docs/
└── sources/      one digest per outside source
```

## Every page

```yaml
---
title: Human title
type: entity | concept | decision | guide | source | overview
summary: One line; index.md copies it.
status: active | superseded | archived
created: YYYY-MM-DD
updated: YYYY-MM-DD
last_verified: YYYY-MM-DD   # last checked against code or source
sources: [path/in/repo, "PR #123", "https://…"]
tags: [a, b]
---
```

Then `# Title`, a 1–3 sentence summary, the content, and `## Related` with `[[wikilinks]]`.

## Rules

1. Cite a source for every claim (path, PR, commit, link). Unsourced → write *(unverified)*.
2. Never delete a superseded page: set `status: superseded` and link the replacement.
3. `[[page-name]]` for internal links (Obsidian), normal links for everything else.
4. Kebab-case filenames. Decisions: `decisions/NNNN-short-name.md`.
5. Pages ≤ ~300 lines. Split bigger ones.
6. No secrets, tokens, key values, client PII, or billing rates. Env var names are fine.
7. Plain English, short sentences, written for a new teammate.

## Operations

- **Ingest** (new source): write `sources/<name>.md`, update affected pages, add to `index.md`, log `## [YYYY-MM-DD] ingest | <title>`.
- **Query**: read `index.md`, open relevant pages, answer with citations. If the answer took real synthesis, file it as a page and log `query`.
- **Session / close-out**: log `## [YYYY-MM-DD] session | <one line>`; fix any page the session proved wrong; add pages for new lasting decisions/gotchas; bump `updated` and `last_verified`.
- **Lint**: `python3 ~/.claude/skills/closeout/wiki-template/wiki_lint.py <repo>` (dead links, orphans, index coverage, frontmatter, sizes, stale `last_verified` > 120 days). Log `lint`.

## Project notes

- **Public repo** (`noidsoup/loops`, MIT). Write as if any loops user may read it. Personal model stacks, host names and private harness names stay out (they live in the gitignored `adapters/MODEL_CLASSES.local.md`).
- **Truth lives in the canonical files:** `loops/<name>/loop.md` + `loop.yaml`, `dispatcher/`, `personas/`, `contracts/`, `schema/`. The wiki explains why and how they fit; it never restates a loop's phases in full. Never edit emitted copies (`.cursor/rules/loops-*.mdc`, `.claude/skills/loops-*/`).
- This wiki must not change loop behavior. Loop files are read by every project on the machine through `~/.loops`.
- Before 2026-10-19 the vault was `loops wiki/`; old log entries keep that name.
- `memories/` is an archived mirror; don't add to it. Session history goes in `AI_SESSION_MEMORY.md`.
