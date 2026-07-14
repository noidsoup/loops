# Model classes (loops)

Phases declare a `model_class` in each loop’s `loop.yaml`. This file is the **portable default** for Cursor and Claude Code.

## Resolution order (important)

1. If `LOOPS_ROOT/adapters/MODEL_CLASSES.local.md` exists, **Read that file and follow it.** It overrides class → model mapping, bans, fallbacks, and any extra platforms.
2. Otherwise use this file.

Copy `MODEL_CLASSES.local.example.md` → `MODEL_CLASSES.local.md` to customize. The local file is gitignored — keep personal stacks and bans out of the shared repo.

## Classes

| Class | Intent |
|---|---|
| `high-reasoning` | Planning, specs, adversarial attack, deep review. Prefer a Task/subagent when the product allows. |
| `workhorse` | Implementation, edits, normal execution. Stay in the main session. |
| `cheap-fast` | Handoffs, summaries, commit messages. Stay in the main session; stay terse. |

## Class → model table (Cursor)

Cursor splits usage into a **first-party pool** (Auto, Composer, Grok — included usage) and an **API pool** (Claude, GPT, Gemini, etc. — billed at API rates). See [Cursor models & pricing](https://cursor.com/docs/models-and-pricing).

**Default to Auto** for every class. Auto picks among first-party models and reacts to live pool state. Override to a specific model only when you have a reason.

| Class | Default | Explicit override (when needed) |
|---|---|---|
| `high-reasoning` | `Auto` | A stronger API-pool model via Task/subagent (e.g. Claude Opus) when the phase truly needs it — announce spend in one line |
| `workhorse` | `Auto` | — |
| `cheap-fast` | `Auto` | — |

### When to leave Auto

1. **High-reasoning that needs the deepest reasoning available** — dispatch via Task/subagent to a strong API-pool model the user has access to.
2. **User asked for a specific model** — honor it.
3. Otherwise stay on Auto.

Prefer not to select Cursor `*-fast` / “(Fast)” variants when they cost more than the regular model for the same family. Prefer not to select the most expensive API-pool models unless the phase clearly needs them or the local override says otherwise.

### Cursor runtime

1. Read the phase’s `model_class` from `loop.yaml` (or the loop’s Model selection section).
2. Apply **local override** if present; else this table.
3. Default: run with Auto (subagent for high-reasoning when useful).
4. If Auto fails (“model not available” / quota), tell the user in one line and fall back to the next model in the local override, or any strong model still available on their plan. Do not stall asking permission.
5. Enable Max Mode only for high-reasoning phases that need very large context.

Dispatcher classification may stay on the current session model. After dispatch, the **chosen loop** owns `model_class` behavior.

## Claude Code (advisory)

Claude Code often cannot switch models mid-session. Treat `model_class` as guidance:

- Prefer a high-reasoning session (or a second session) for `high-reasoning` when the product allows.
- Run `workhorse` / `cheap-fast` in the current session when switching is impossible.
- If you cannot switch, note it once and continue — do not block the loop.

## Extra platforms

This default file only documents Cursor and Claude Code. If you run loops inside another agent host, put that host’s table and runtime rules in `MODEL_CLASSES.local.md`.

## Where classes live

Each loop’s `loop.yaml` sets `model_class` per phase. Loop `loop.md` files summarize the phase map and point here.
