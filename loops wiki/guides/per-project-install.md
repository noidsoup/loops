---
title: Per-project install (.loops/)
type: guide
created: 2026-07-30
updated: 2026-07-30
tags: [install, per-project, teammates]
status: active
---

# Per-project install (.loops/)

Lock loops to a **single repo** for teammates or pin a specific loops revision — alternative to [[global-install-and-update]].

## Prerequisites

- Node.js 18+
- Git remote access to `noidsoup/loops`
- If global install exists (`~/.loops`), agent prefers **project-local** `.loops/` when present

## Steps

```bash
cd your-project
git clone https://github.com/noidsoup/loops.git .loops
node .loops/adapters/emit.js
mkdir -p .cursor/rules .claude/rules
cp .loops/INSTALL.mdc .cursor/rules/loops.mdc
cp .loops/INSTALL-CLAUDE.md .claude/rules/loops.md
```

### Resulting layout

```
your-project/
├── .loops/                         ← canonical loops source
├── .cursor/rules/loops-*.mdc       ← emitted Cursor rules
├── .claude/skills/loops-*/         ← emitted Claude skills
├── .cursor/rules/loops.mdc         ← awareness
└── .claude/rules/loops.md
```

### Try it

> use the loops to add a CLI command that prints the current time

### Edit a loop

```bash
$EDITOR .loops/loops/plan-and-implement/loop.md
node .loops/adapters/emit.js
```

### Update

```bash
cd .loops && git pull && cd ..
node .loops/adapters/emit.js
```

Full walkthrough also in `examples/install-in-fresh-project.md` (ingested context in [[readme-project-overview]]).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Emit wrote into `.loops/` instead of project root | Clone must be named `.loops` exactly |
| Duplicate global + local rules | Skip awareness copy if global install suffices |
| Teammates missing loops | Commit `.loops/` as submodule or document clone step |

## Related

- [[global-install-and-update]]
- [[adapters-emit-and-install-global]]
- [[documentation-in-repo]]
