# loops

**Portable workflow loops for Cursor and Claude Code.**

Say **"use the loops"** and the agent picks a workflow — plan, build, test, review, stress-test — and runs it end to end. No CLI. No accounts. No hosted service. The git repo is the product.

**Requires Node.js 18+.**

## Why

Agent chats drift. Loops give the agent a named playbook with phases, so “build auth” or “review this PR” follows the same structure every time instead of improvising.

## Quick start (this machine, all projects)

```bash
git clone https://github.com/noidsoup/loops.git ~/Code/loops   # or your path
cd ~/Code/loops
node adapters/emit.js
node adapters/install-global.js                # Cursor + Claude Code
# node adapters/install-global.js --cursor-only
# node adapters/install-global.js --claude-only
```

That will:

1. Emit namespaced `loops-*` rules/skills from the canonical `loop.md` files
2. Symlink `~/.loops` → this repo
3. Wire Cursor (`~/.cursor/rules/loops.mdc` + skills) and Claude Code (`~/.claude/rules/loops.md` + skills)

Then in Cursor or Claude Code, say **use the loops** or name a task (“write tests for the parser”, “review this PR”).

### Claude Code

- Say **"use the loops"** — awareness rule + dispatcher route you
- Or invoke a skill: `/loops-dispatcher`, `/loops-tdd`, `/loops-plan-and-implement`, …

Update later:

```bash
cd ~/.loops
git pull
npm test      # optional
node adapters/emit.js
node adapters/install-global.js
```

Uninstall: `node adapters/install-global.js --uninstall`  
If symlinks are ignored by the IDE, re-run with `--copy`.

## Per-project install (optional)

Use this when you want the pack versioned with a single repo for teammates:

```bash
cd your-project
git clone https://github.com/noidsoup/loops.git .loops
node .loops/adapters/emit.js
mkdir -p .cursor/rules .claude/rules
cp .loops/INSTALL.mdc .cursor/rules/loops.mdc
cp .loops/INSTALL-CLAUDE.md .claude/rules/loops.md
```

If a project has `.loops/` **and** the machine has a global install, **project-local `.loops/` wins**. Walkthrough: [`examples/install-in-fresh-project.md`](examples/install-in-fresh-project.md).

## Using it

Examples (you usually describe intent; the agent classifies):

| You say | Loop |
|---|---|
| “use the loops” | dispatcher → best fit |
| “build a new auth flow” | `plan-and-implement` |
| “write tests for the parser” | `tdd` |
| “stress-test this design” | `sar` |
| “review this PR” | `adversarial-gate` |
| “reproduce this bug” | `reproduce-and-fix` |
| “upgrade Next to 15” | `migrate` |
| “explain this codebase” | `explain-codebase` |
| “de-ai-ify” / “remove the slop” / “humanize this” | `de-ai-ify` |
| “swarm this” / “full pipeline” | `swarm` |
| “use the loops on this” (ambiguous) | `use-the-loop` |

**Swarm vs use-the-loop:** “swarm” / “full pipeline” → `swarm`. Ambiguous “use the loops on this” → `use-the-loop` (smallest composition). Swarm keywords win.

## Configure your model stack

Phases use three classes: `high-reasoning`, `workhorse`, `cheap-fast`.

- **Defaults (shared):** [`adapters/MODEL_CLASSES.md`](adapters/MODEL_CLASSES.md) — Cursor defaults to Auto; Claude Code is advisory.
- **Your machine (optional):** copy [`adapters/MODEL_CLASSES.local.example.md`](adapters/MODEL_CLASSES.local.example.md) → `adapters/MODEL_CLASSES.local.md` and edit. That file is **gitignored**. If it exists, agents follow it instead of the defaults (bans, preferred models, extra agent hosts).

You do not need a local file to use loops. Add one when you care about model routing, cost caps, or a second agent platform.

## How it works

### Global layout

```
~/.loops/                           ← symlink to the loops repo
~/.cursor/rules/loops.mdc           ← Cursor always-on awareness
~/.cursor/rules/loops-*.mdc         ← emitted loop rules
~/.cursor/skills/loops-*/           ← emitted skills
~/.claude/rules/loops.md            ← Claude always-on awareness
~/.claude/skills/loops-*/           ← Claude skills (/loops-<name>)
```

### Per-project layout

```
your-project/
├── .cursor/rules/loops.mdc + loops-*.mdc
├── .claude/rules/loops.md + skills/loops-*/
└── .loops/                         ← this repo
```

Re-run `node adapters/emit.js` after editing any `loop.md`. Global installs also need `install-global.js`. Check drift: `node adapters/emit.js --check`.

## Catalog

| Loop | Use for |
|---|---|
| `plan-and-implement` | New feature / refactor — spec first, then implement |
| `tdd` | Drive a change with tests |
| `sar` | Spec → Attack → Repair with persona lenses |
| `adversarial-gate` | Pre-merge / PR review gate |
| `reproduce-and-fix` | Minimal repro → failing test → fix → green |
| `migrate` | Framework/version upgrade with rollback |
| `explain-codebase` | Onboarding map for an unfamiliar repo |
| `de-ai-ify` | Polish code that reads as AI-generated |
| `swarm` | Full beginning-to-end ship pipeline |
| `use-the-loop` | Meta-router — smallest composition that fits |

**Conductors:** `dispatcher` classifies intent → one loop. `use-the-loop` may chain two. `swarm` runs the full pipeline.

## Personas

Review lenses under `personas/` (skeptic, security-auditor, simplicity-advocate, and others). Used inside `sar` and `adversarial-gate` — those loops **Read** `personas/<name>.md` before each persona step. Not top-level dispatcher options — see `personas/README.md`.

## Adding a loop

```bash
mkdir -p loops/<name>
# write loops/<name>/loop.md and loop.yaml  (schema: schema/loop.schema.json)
node adapters/emit.js <name>
npm test
node adapters/install-global.js   # if using global install
```

## Design principles

1. **No CLI** — loops are instructions the agent runs.
2. **Repo is the backend** — git is version control, registry, and distribution.
3. **One source of truth per loop** — canonical `loop.md` + `loop.yaml`; adapters only emit.
4. **Dispatch by intent** — describe what you want; naming a loop is optional.
5. **Stack is configurable** — portable defaults in-repo; personal routing stays in `MODEL_CLASSES.local.md`.

## Develop / test

```bash
npm test
node adapters/emit.js --check
node adapters/install-global.js --dry-run
```

## Status

v0.1.2 — general-audience README; portable model defaults; optional local stack override. See [`CHANGELOG.md`](CHANGELOG.md).

## License

MIT
