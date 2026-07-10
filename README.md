# loops

**Portable workflow loops for Cursor and Claude Code.**

Say "use the loops," and the agent picks the right workflow — plan, build, test, review, stress-test — and runs it end-to-end. No CLI. No accounts. No service. The repo is the product.

**Requires Node.js 18+.**

## Which install?

| Goal | Path |
|---|---|
| Every project on this machine | **Global** (recommended) — below |
| One repo shared with teammates | **Per-project** — clone into `.loops/` |

Both paths emit the same `loops-*` namespaced rules/skills (no Hermes collisions).

## Install for all Cursor + Claude Code projects (recommended)

```bash
git clone git@github.com:noidsoup/loops.git ~/Code/loops   # or your preferred path
cd ~/Code/loops
node adapters/emit.js
node adapters/install-global.js                # both (default)
# node adapters/install-global.js --cursor-only
# node adapters/install-global.js --claude-only
```

What that does:

1. Emits Cursor rules + Claude skills from canonical `loop.md` files (`loops-*` prefix)
2. Creates `~/.loops` → this repo (stable path)
3. **Cursor:** writes `~/.cursor/rules/loops.mdc` (`alwaysApply`) and symlinks `loops-*` rules/skills under `~/.cursor/`
4. **Claude Code:** writes `~/.claude/rules/loops.md` (user-level always-on) and installs `~/.claude/skills/loops-*/`

### Using loops in Claude Code

- Say **"use the loops"** — awareness rule + dispatcher skill route you
- Or invoke a skill directly: `/loops-dispatcher`, `/loops-tdd`, `/loops-plan-and-implement`, etc.

Claude limitation vs Cursor: Claude has no `alwaysApply` `.mdc` flag. User-level `~/.claude/rules/loops.md` is the equivalent always-on hook.

Update later:

```bash
cd ~/.loops   # or the clone path
git pull
npm test      # optional
node adapters/emit.js
node adapters/install-global.js
```

Uninstall:

```bash
node adapters/install-global.js --uninstall                 # both
node adapters/install-global.js --uninstall --claude-only
node adapters/install-global.js --uninstall --cursor-only
```

If Cursor or Claude ever fails to follow symlinks for rules/skills, re-run with `--copy`:

```bash
node adapters/install-global.js --copy
```

Personas stay in the repo at `~/.loops/personas/` — `sar` / `adversarial-gate` **Read** those files before each persona step.

## Per-project install (optional)

```bash
cd your-project
git clone git@github.com:noidsoup/loops.git .loops
node .loops/adapters/emit.js   # writes loops-* into this project (not inside .loops/)
mkdir -p .cursor/rules .claude/rules
cp .loops/INSTALL.mdc .cursor/rules/loops.mdc
cp .loops/INSTALL-CLAUDE.md .claude/rules/loops.md
```

If a project has `.loops/` **and** the machine has a global install, **project-local `.loops/` wins** for that workspace. Full walkthrough: [`examples/install-in-fresh-project.md`](examples/install-in-fresh-project.md).

## Using it

In Cursor or Claude Code, say any of:

- "use the loops" — the agent routes to the right loop
- "build a new auth flow" → `plan-and-implement`
- "write tests for the parser" → `tdd`
- "stress-test this design" → `sar`
- "review this PR" → `adversarial-gate`
- "reproduce this bug" → `reproduce-and-fix`
- "upgrade Next to 15" → `migrate`
- "explain this codebase" → `explain-codebase`
- "swarm this feature" → `swarm` (full ship pipeline)
- "use the loops on this" → `use-the-loop` (smallest composition / meta-router)

You usually don't name loops. The agent classifies intent and dispatches. Explicit names ("run tdd") also work.

**Swarm vs use-the-loop:** "swarm this feature" / "full pipeline" → `swarm` (full chain). "use the loops on this" when ambiguous → `use-the-loop` (smallest composition). Swarm keywords win.

## Model classes (Cursor)

Phases declare `model_class` (`high-reasoning` / `workhorse` / `cheap-fast`). Prefer Task/subagent for high-reasoning when available; otherwise continue best-effort with the strongest non-Fable model. Fall back to `grok-4.5-xhigh` on usage limits. **Never use Fable.** Full map: [`adapters/MODEL_CLASSES.md`](adapters/MODEL_CLASSES.md). Claude Code: advisory only.

## How it works

### Global layout

```
~/.loops/                           ← symlink to the loops repo
~/.cursor/rules/loops.mdc           ← Cursor alwaysApply awareness
~/.cursor/rules/loops-*.mdc         ← emitted loop rules (symlinked)
~/.cursor/skills/loops-*/           ← emitted skills (symlinked, namespaced)
~/.claude/rules/loops.md            ← Claude user-level always-on awareness
~/.claude/skills/loops-*/           ← Claude skills (namespaced; /loops-<name>)
```

Canonical definitions: `~/.loops/dispatcher/`, `~/.loops/loops/<name>/`, `~/.loops/personas/`.

### Per-project layout

```
your-project/
├── .cursor/rules/
│   ├── loops.mdc                   ← from INSTALL.mdc
│   └── loops-*.mdc                 ← emitted
├── .claude/
│   ├── rules/loops.md              ← from INSTALL-CLAUDE.md
│   └── skills/loops-*/             ← emitted
└── .loops/                         ← this repo (source of truth)
    ├── dispatcher/loop.{md,yaml}
    ├── loops/<name>/loop.{md,yaml}
    ├── personas/
    └── adapters/emit.js
```

Re-run `node adapters/emit.js` after editing any `loop.md`. For global installs, also re-run `install-global.js`. Check drift with `node adapters/emit.js --check`.

## Loops

| Loop | Use for |
|---|---|
| `plan-and-implement` | Build a new feature, refactor, or non-trivial change. Spec first, then implement. |
| `tdd` | Drive a change by tests. Lock in behavior with a test suite. |
| `sar` | Spec → Attack → Repair. Candidates + persona attacks → simplest correct. |
| `adversarial-gate` | Pre-merge review. Run the adversarial gate on a PR or branch. |
| `reproduce-and-fix` | Minimal repro → failing test → fix → prove green. |
| `migrate` | Version/framework upgrade with checklist and rollback. |
| `explain-codebase` | Onboarding map for an unfamiliar repo. |
| `swarm` | Mega-loop. Full beginning-to-end ship pipeline for the task. |
| `use-the-loop` | Meta-router. Smallest composition that fits; may chain 2. |

### Conductor roles

| Loop | Role |
|---|---|
| `dispatcher` | Classify intent → one loop. |
| `use-the-loop` | Meta: smallest composition / maybe chain 2. |
| `swarm` | Mega: full beginning-to-end pipeline. |

## Personas

Review lenses under `personas/` (skeptic, security-auditor, simplicity-advocate, perf-critic, regression-hunter, edge-case-analyst, a11y-advocate, api-contract-guardian, dx-critic). Used inside `sar` and `adversarial-gate` — those loops **Read** `personas/<name>.md` before each step. Not dispatcher options — see `personas/README.md`.

## Adding a new loop

```bash
mkdir -p loops/<name>          # in the loops repo (or .loops/loops/<name> per-project)
# write loops/<name>/loop.md
# write loops/<name>/loop.yaml   # see schema/loop.schema.json
node adapters/emit.js <name>
npm test
node adapters/install-global.js   # if using global install
```

## Design principles

1. **No CLI.** Loops are LLM instructions. The agent runs them. No binary needed.
2. **Repo is the backend.** Git is the version control, the registry, the distribution. No service.
3. **One source of truth per loop.** Canonical `loop.md` + `loop.yaml`. Adapters are dumb generators.
4. **Loops are dispatchable by intent.** You usually don't name a loop. You describe what you want.
5. **Solo-friendly.** v1 is built for two people. Team features, hosted services, billing come later if they earn it.

## Develop / test

```bash
npm test                 # unit + emit --check
node adapters/emit.js --check
node adapters/install-global.js --dry-run
```

## Status

v0.1.1 — audit fixes: persona file reads, `loops-*` emit everywhere (including per-project), Claude project awareness, emit `--check` + CI, fuller skill descriptions, narrowed triggers, LOOPS_ROOT paths. See [`CHANGELOG.md`](CHANGELOG.md).
