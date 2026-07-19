# loops is installed in this project (Claude Code)

<!-- loops-project-install -->

This project has `loops` at `.loops/` (or uses the machine global `~/.loops`). When the user says **"use the loops"** (or equivalent), read `LOOPS_ROOT/dispatcher/loop.md` and follow it.

Resolve `LOOPS_ROOT`: project `.loops/` if present, else `~/.loops`.

- Invoke skills as `/loops-dispatcher`, `/loops-tdd`, `/loops-plan-and-implement`, etc.
- Prefer canonical `LOOPS_ROOT/**/loop.md` over skill copies.
- Personas: `LOOPS_ROOT/personas/` — used inside `sar` / `adversarial-gate` only; those loops Read the persona files.
- Self-correcting: producing loops with `self_correcting: true` Read `LOOPS_ROOT/contracts/self-correcting.md`.
- Model classes: advisory on Claude Code — see `LOOPS_ROOT/adapters/MODEL_CLASSES.md` (local override wins if present).

Copy this file to `.claude/rules/loops.md` on per-project install (see `examples/install-in-fresh-project.md`).
