# loops

**Portable workflow loops for Cursor and Claude Code.**

Say "use the loops," and the agent picks the right workflow — plan, build, test, review, stress-test — and runs it end-to-end. No CLI. No accounts. No service. The repo is the product.

## Install for all Cursor + Claude Code projects (recommended)

Make loops available in **every** Cursor and Claude Code project on this machine:

```bash
git clone git@github.com:noidsoup/loops.git ~/Code/loops   # or your preferred path
cd ~/Code/loops
node adapters/emit.js
node adapters/install-global.js                # both (default)
# node adapters/install-global.js --cursor-only
# node adapters/install-global.js --claude-only
```

What that does:

1. Emits Cursor rules + Claude skills from canonical `loop.md` files
2. Creates `~/.loops` → this repo (stable path)
3. **Cursor:** writes `~/.cursor/rules/loops.mdc` (`alwaysApply`) and symlinks `loops-*` rules/skills under `~/.cursor/`
4. **Claude Code:** writes `~/.claude/rules/loops.md` (user-level always-on) and installs `~/.claude/skills/loops-*/` (SKILL.md `name:` matches the folder; supporting files symlinked)

The `loops-` prefix avoids colliding with other skills (e.g. Hermes `plan-and-implement`).

### Using loops in Claude Code

- Say **"use the loops"** — awareness rule + dispatcher skill route you
- Or invoke a skill directly: `/loops-dispatcher`, `/loops-tdd`, `/loops-plan-and-implement`, etc.
- List skills in-session with `/skills` if your Claude Code build supports it

Claude limitation vs Cursor: Claude has no `alwaysApply` `.mdc` flag. User-level `~/.claude/rules/loops.md` is the equivalent always-on hook; skills still load on demand via description match or `/loops-*`.

Update later:

```bash
cd ~/.loops   # or the clone path
git pull
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

Personas stay in the repo at `~/.loops/personas/` — loops load them from there; no separate install.

## Per-project install (optional)

For a single repo that should carry its own clone (e.g. sharing with teammates who don't have the global install):

```bash
cd your-project
git clone git@github.com:noidsoup/loops.git .loops
node .loops/adapters/emit.js
cp .loops/INSTALL.mdc .cursor/rules/loops.mdc
```

Cursor picks up `.cursor/rules/`. Claude Code picks up `.claude/skills/`. Both use the same canonical definitions.

If a project has `.loops/` **and** the machine has a global install, **project-local `.loops/` wins** for that workspace.

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

You don't name loops. The agent classifies intent and dispatches.

## Model classes (Cursor)

Phases declare `model_class` (`high-reasoning` / `workhorse` / `cheap-fast`). Cursor agents must actually dispatch high-reasoning phases via Task/subagent and fall back to `grok-4.5-xhigh` on usage limits. **Never use Fable.** Full map: [`adapters/MODEL_CLASSES.md`](adapters/MODEL_CLASSES.md). Claude Code: advisory only (switch session if needed).

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
├── .cursor/rules/                  ← Cursor reads these
│   ├── loops.mdc                   ← from INSTALL.mdc
│   ├── dispatcher.mdc
│   └── ...
├── .claude/skills/                 ← Claude Code reads these
│   ├── dispatcher/SKILL.md
│   └── ...
└── .loops/                         ← this repo (source of truth)
    ├── dispatcher/loop.{md,yaml}
    ├── loops/<name>/loop.{md,yaml}
    ├── personas/                   ← review lenses (not dispatcher options)
    └── adapters/emit.js
```

The adapters emit platform-specific files (`.mdc` for Cursor, `SKILL.md` for Claude Code) from those definitions. Re-run `node adapters/emit.js` after editing any `loop.md` to regenerate. For global installs, also re-run `install-global.js`.

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

Review lenses under `personas/` (skeptic, security-auditor, simplicity-advocate, perf-critic, regression-hunter, edge-case-analyst, a11y-advocate, api-contract-guardian, dx-critic). Used inside `sar` and `adversarial-gate`. Not dispatcher options — see `personas/README.md`.

## Adding a new loop

```bash
mkdir -p loops/<name>          # in the loops repo (or .loops/loops/<name> per-project)
# write loops/<name>/loop.md
# write loops/<name>/loop.yaml
node adapters/emit.js <name>
node adapters/install-global.js   # if using global install
```

## Design principles

1. **No CLI.** Loops are LLM instructions. The agent runs them. No binary needed.
2. **Repo is the backend.** Git is the version control, the registry, the distribution. No service.
3. **One source of truth per loop.** Canonical `loop.md` + `loop.yaml`. Adapters are dumb generators.
4. **Loops are dispatchable by intent.** You don't name a loop. You describe what you want.
5. **Solo-friendly.** v1 is built for two people. Team features, hosted services, billing come later if they earn it.

## Status

v0.1.0 — catalog expanded. Flagships (`plan-and-implement`, `tdd`, `sar`, `adversarial-gate`, `use-the-loop`), plus `reproduce-and-fix`, `migrate`, `explain-codebase`, and mega-loop `swarm`. Personas catalog in `personas/`. Global Cursor + Claude Code install via `adapters/install-global.js`.
