# loops

Playbooks for AI coding agents in **Cursor** and **Claude Code**.

Say **“use the loops”** and the agent picks a workflow — plan, build, test, review — and follows it step by step. No extra app. No account. You install from this repo once.

Needs **Node.js 18+**.

## Install (all projects on your computer)

```bash
git clone https://github.com/noidsoup/loops.git ~/Code/loops
cd ~/Code/loops
node adapters/emit.js
node adapters/install-global.js
```

Then open any project in Cursor or Claude Code and say **use the loops**, or just describe the job (“write tests for the parser”, “review this PR”).

In Claude Code you can also type `/loops-dispatcher`, `/loops-tdd`, and so on.

**Update later:**

```bash
cd ~/.loops && git pull && node adapters/emit.js && node adapters/install-global.js
```

**Remove:** `node adapters/install-global.js --uninstall`

## What to say

| You say | What happens |
|---|---|
| “use the loops” | Picks the best fit |
| “build a new auth flow” | Plan, then build |
| “write tests for the parser” | Tests first |
| “stress-test this design” | Spec, attack, fix gaps |
| “review this PR” | Pre-merge review |
| “reproduce this bug” | Repro → failing test → fix |
| “upgrade Next to 15” | Upgrade with a checklist |
| “explain this codebase” | Map of the repo |
| “remove the slop” / “de-ai-ify” | Clean up AI-sounding code |
| “swarm this” | Full start-to-finish pipeline |

You usually don’t need the workflow name. Just describe what you want.

## Which AI models to use

Out of the box, Cursor mostly stays on **Auto**. That’s fine to try loops.

To use the author’s setup (stronger models for hard planning steps):

```bash
cp adapters/MODEL_CLASSES.local.example.md adapters/MODEL_CLASSES.local.md
```

That file lives only on your machine. It asks for **Opus** on hard thinking steps, lighter models for everyday work. Details: [`adapters/MODEL_CLASSES.local.example.md`](adapters/MODEL_CLASSES.local.example.md). Soft defaults: [`adapters/MODEL_CLASSES.md`](adapters/MODEL_CLASSES.md).

## One project only (optional)

If you want loops locked to a single repo for teammates:

```bash
cd your-project
git clone https://github.com/noidsoup/loops.git .loops
node .loops/adapters/emit.js
mkdir -p .cursor/rules .claude/rules
cp .loops/INSTALL.mdc .cursor/rules/loops.mdc
cp .loops/INSTALL-CLAUDE.md .claude/rules/loops.md
```

More detail: [`examples/install-in-fresh-project.md`](examples/install-in-fresh-project.md).

## Workflows included

| Name | For |
|---|---|
| `plan-and-implement` | New feature or refactor — plan first |
| `tdd` | Change driven by tests |
| `sar` | Spec → attack → repair |
| `adversarial-gate` | Review before merge |
| `reproduce-and-fix` | Bug → test → fix |
| `migrate` | Framework or version upgrade |
| `explain-codebase` | Learn an unfamiliar repo |
| `de-ai-ify` | Tone down AI-sounding code |
| `swarm` | Full pipeline |
| `use-the-loop` | Smallest mix that fits when it’s unclear |

## License

MIT · v0.1.3 · [`CHANGELOG.md`](CHANGELOG.md)
