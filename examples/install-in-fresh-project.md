# Example: install loops in a fresh project

This shows the full flow from "fresh repo" to "agent using loops."

> **Prefer global install** when you want loops in every Cursor + Claude Code project on one machine — see the README (`node adapters/install-global.js`). The steps below are the **per-project** alternative (clone into `.loops/`). Both paths use the same `loops-*` skill/rule names.

## Step 1 — Fresh project

```bash
mkdir ~/code/my-cool-project
cd ~/code/my-cool-project
git init
```

## Step 2 — Install loops

```bash
git clone git@github.com:noidsoup/loops.git .loops
node .loops/adapters/emit.js
```

Because the clone is named `.loops`, emit writes into the **project** root (not inside `.loops/`):

```
my-cool-project/
├── .loops/                         ← canonical source
├── .cursor/rules/loops-*.mdc       ← emitted Cursor rules
├── .claude/skills/loops-*/         ← emitted Claude skills (namespaced)
├── .cursor/rules/loops.mdc         ← awareness (next step)
└── .claude/rules/loops.md          ← Claude awareness (next step)
```

Install awareness rules:

```bash
mkdir -p .cursor/rules .claude/rules
cp .loops/INSTALL.mdc .cursor/rules/loops.mdc
cp .loops/INSTALL-CLAUDE.md .claude/rules/loops.md
```

If this machine already has a global install (`~/.cursor/rules/loops.mdc` + `~/.loops`), you can skip the per-project clone — the agent will use the global root. Use a project-local `.loops/` only when you want a pinned or shareable copy.

## Step 3 — Open the project in Cursor or Claude Code

Say:

> "use the loops to add a CLI command that prints the current time"

The agent reads the awareness rule, runs the dispatcher, picks `plan-and-implement`, specs the change, and implements it.

| You say | Loop |
|---|---|
| "write tests for …" | `tdd` |
| "stress-test this design" | `sar` |
| "review this PR" | `adversarial-gate` |
| "reproduce this bug" | `reproduce-and-fix` |
| "upgrade …" / "migrate …" | `migrate` |
| "explain this codebase" | `explain-codebase` |
| "swarm this feature" | `swarm` (full pipeline) |
| "use the loops on this" (ambiguous) | `use-the-loop` |

Claude Code: you can also invoke `/loops-dispatcher` or `/loops-plan-and-implement` directly.

## Step 4 — Editing a loop

```bash
$EDITOR .loops/loops/plan-and-implement/loop.md
node .loops/adapters/emit.js
```

Both agents pick up the new behavior (emitted files refresh under the project root).

## Step 5 — Updating loops

```bash
cd .loops && git pull && cd ..
node .loops/adapters/emit.js
```
