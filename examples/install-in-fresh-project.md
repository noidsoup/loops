# Example: install loops in a fresh project

This shows the full flow from "fresh repo" to "agent using loops."

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

After this, your project has:

```
my-cool-project/
├── .loops/                  ← this repo, the source of truth
├── .cursor/rules/           ← Cursor reads these
└── .claude/skills/          ← Claude Code reads these
```

You also want to copy `INSTALL.mdc` from `.loops/` to your project root so Cursor's agent knows loops are installed:

```bash
cp .loops/INSTALL.mdc .cursor/rules/loops.mdc
```

## Step 3 — Open the project in Cursor or Claude Code

Say:

> "use the loops to add a CLI command that prints the current time"

The agent reads `.cursor/rules/loops.mdc` (or `.claude/skills/dispatcher/SKILL.md`), sees loops are installed, runs the dispatcher, picks `plan-and-implement`, specs the change, and implements it.

## Step 4 — Editing a loop

Loops evolve. Edit the canonical source:

```bash
$EDITOR .loops/loops/plan-and-implement/loop.md
node .loops/adapters/emit.js
```

Both agents pick up the new behavior.

## Step 5 — Updating loops

When the upstream `loops` repo gets new loops or fixes:

```bash
cd .loops
git pull
cd ..
node .loops/adapters/emit.js
```
