# loops

**Portable workflow loops for Cursor and Claude Code.**

Drop `loops` into a project, say "use the loops," and the agent picks the right workflow — plan, build, test, review, stress-test — and runs it end-to-end. No CLI. No accounts. No service. The repo is the product.

## 30-second install

```bash
cd your-project
git clone git@github.com:noidsoup/loops.git .loops
node .loops/adapters/emit.js    # generate Cursor + Claude Code files
```

That's it. Cursor picks up `.cursor/rules/`. Claude Code picks up `.claude/skills/`. Both use the same canonical definitions.

## Using it

In Cursor or Claude Code, say any of:

- "use the loops" — the agent routes to the right loop
- "build a new auth flow" → `plan-and-implement`
- "write tests for the parser" → `tdd`
- "stress-test this design" → `sar`
- "review this PR" → `adversarial-gate`
- "use the loops on this" → `use-the-loop` (the meta-router, for open-ended tasks)

You don't name loops. The agent classifies intent and dispatches.

## How it works

```
your-project/
├── .cursor/rules/                  ← Cursor reads these
│   ├── dispatcher.mdc
│   ├── plan-and-implement.mdc
│   └── ...
├── .claude/skills/                 ← Claude Code reads these
│   ├── dispatcher/SKILL.md
│   ├── plan-and-implement/SKILL.md
│   └── ...
└── .loops/                         ← this repo (source of truth)
    ├── dispatcher/loop.{md,yaml}
    ├── loops/<name>/loop.{md,yaml}
    └── adapters/emit.js
```

The canonical loop definitions live in `.loops/`. The adapters emit platform-specific files (`.mdc` for Cursor, `SKILL.md` for Claude Code) from those definitions. Re-run `node .loops/adapters/emit.js` after editing any `loop.md` to regenerate.

## Loops

| Loop | Use for |
|---|---|
| `plan-and-implement` | Build a new feature, refactor, or non-trivial change. Spec first, then implement. |
| `tdd` | Drive a change by tests. Lock in behavior with a test suite. |
| `sar` | Spec → Attack → Repair. Adversarial review. Stress-test a design or implementation. |
| `adversarial-gate` | Pre-merge review. Run the adversarial gate on a PR or branch. |
| `use-the-loop` | The meta-router. The user wants you to figure out which loop fits, possibly chaining. |

## Adding a new loop

```bash
mkdir -p .loops/loops/<name>
# write .loops/loops/<name>/loop.md
# write .loops/loops/<name>/loop.yaml
node .loops/adapters/emit.js <name>
```

Both agents pick it up.

## Updating loops

```bash
cd .loops
git pull
node adapters/emit.js
```

## Design principles

1. **No CLI.** Loops are LLM instructions. The agent runs them. No binary needed.
2. **Repo is the backend.** Git is the version control, the registry, the distribution. No service.
3. **One source of truth per loop.** Canonical `loop.md` + `loop.yaml`. Adapters are dumb generators.
4. **Loops are dispatchable by intent.** You don't name a loop. You describe what you want.
5. **Solo-friendly.** v1 is built for two people. Team features, hosted services, billing come later if they earn it.

## Status

v0.1.0 — proof of concept. `plan-and-implement` ported end-to-end. Four more loops to port (`tdd`, `sar`, `adversarial-gate`, `use-the-loop`).
