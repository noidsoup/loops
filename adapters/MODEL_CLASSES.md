# Model classes (loops)

Shared map for phase-level `model_class` on each loop. Canonical preference order for **Cursor**. Claude Code treats the same classes as **advisory** (see below).

**Banned:** any Fable / `fable-5` / `claude-fable-*` model. Never recommend or use them.

## Class → model table (Cursor)

| Class | Prefer (in order) | Fallback if unavailable |
|---|---|---|
| `high-reasoning` | `claude-opus-4-8-thinking-high`, then `gpt-5.5-high` or `claude-sonnet-5-thinking-high` | `grok-4.5-xhigh` (Cursor Grok) |
| `workhorse` | `composer-2.5`, then `composer-2.5-fast` | `grok-4.5-xhigh` |
| `cheap-fast` | `composer-2.5-fast` | `grok-4.5-xhigh` |

"Unavailable" means usage exhausted, rate-limited, quota exceeded, model not allowed, or the Task/subagent call rejects the slug.

## Cursor runtime (preferred, best-effort)

When running a loop **in Cursor**, for each phase:

1. Read that phase’s `model_class` from `loop.yaml` (or the loop’s Model selection section).
2. Resolve the preferred slug from the table above.
3. **`high-reasoning`:** Prefer dispatching the phase via **Task / subagent** with `model` set to the preferred high-reasoning slug when the product allows it. If Task/subagent or that slug is unavailable, use the strongest available non-Fable model in the current session and continue — do not block the loop.
4. **`workhorse`:** Implement in the main agent, or a workhorse subagent with `model: composer-2.5` (then `composer-2.5-fast`) when available.
5. **`cheap-fast`:** Prefer `composer-2.5-fast` for short handoffs / summaries; main agent is fine if already warm.
6. **Fallback protocol:** If the chosen model fails due to usage limits, quota, “model not available”, or similar — **immediately retry the same step** with `grok-4.5-xhigh`. Tell the user in **one short line** that you fell back to Grok due to usage. Do **not** stall asking permission.
7. If already on Grok as fallback, **continue** — do not loop forever trying banned or unavailable models.
8. Never select Fable.

Dispatcher classification may stay on the current session model. After dispatch, the **chosen loop** owns model-class behavior for its phases.

## Claude Code (advisory)

Claude Code often cannot switch models mid-session. Treat `model_class` as guidance:

- Prefer starting a **high-reasoning** session (or a second session) for phases marked `high-reasoning` when the product allows model choice.
- Run `workhorse` / `cheap-fast` phases in the current session when switching is impossible.
- Document best-effort: if you cannot switch, note it once and continue; do not block the loop.
- Same ban: never recommend Fable. If a high model is unavailable, prefer whatever strong non-Fable model the user has; there is no Cursor Grok slug in Claude Code — use the user’s best available alternative.

## Where classes live

Each loop’s `loop.yaml` sets `model_class` per phase. Loop `loop.md` files summarize Cursor behavior and point here (`LOOPS_ROOT/adapters/MODEL_CLASSES.md`).
