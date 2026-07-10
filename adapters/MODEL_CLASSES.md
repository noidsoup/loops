# Model classes (loops)

Shared map for phase-level `model_class` on each loop. Canonical preference order is per-platform: **Cursor** (table below) is preferred when available, **Hermes / Nous Portal** is preferred when running inside Hermes desktop or any agent that routes through Nous, **Claude Code** treats the same classes as **advisory** (see bottom).

**Banned (all platforms):** any Fable / `fable-5` / `claude-fable-*` model. Never recommend or use them. This applies to Nous Portal too — even though `claude-fable-5` is the most expensive model on the portal, the loops ban is absolute.

## Class → model table (Cursor)

**Composer-fast is banned.** `composer-2.5-fast` consumes more usage in Cursor than regular `composer-2.5` and is not used by any class. If a `*-fast` variant is ever added to a future Cursor model family, treat it the same way: do not route to it.

| Class | Prefer (in order) | Fallback if unavailable |
|---|---|---|
| `high-reasoning` | `claude-opus-4-8-thinking-high`, then `gpt-5.5-high` or `claude-sonnet-5-thinking-high` | `grok-4.5-xhigh` (Cursor Grok) |
| `workhorse` | `grok-4.5-xhigh` (Cursor Grok) | `composer-2.5` (regular — never fast) |
| `cheap-fast` | `grok-4.5-xhigh` (Cursor Grok) | `composer-2.5` (regular — never fast) |

"Unavailable" means usage exhausted, rate-limited, quota exceeded, model not allowed, or the Task/subagent call rejects the slug.

## Cursor runtime (preferred, best-effort)

When running a loop **in Cursor**, for each phase:

1. Read that phase’s `model_class` from `loop.yaml` (or the loop’s Model selection section).
2. Resolve the preferred slug from the table above.
3. **`high-reasoning`:** Prefer dispatching the phase via **Task / subagent** with `model` set to the preferred high-reasoning slug when the product allows it. If Task/subagent or that slug is unavailable, use the strongest available non-Fable model in the current session and continue — do not block the loop.
4. **`workhorse`:** Implement in the main agent, or a workhorse subagent with `model: grok-4.5-xhigh` (Cursor Grok). Fallback to `composer-2.5` (regular — never `composer-2.5-fast`) if Grok is unavailable.
5. **`cheap-fast`:** Prefer `grok-4.5-xhigh` for short handoffs / summaries; main agent is fine if already warm. Do not use `composer-2.5-fast` — it consumes more Cursor usage than regular composer.
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

## Class → model table (Hermes / Nous Portal)

Slug format: `provider/model`. Cost figures are Nous Portal published rates (June 2026, per `nous-portal-pricing` skill). Per-turn cost assumes a 10k input / 2k output turn for rough comparison only.

| Class | Prefer (in order) | Fallback if unavailable | Approx $/turn |
|---|---|---|---|
| `high-reasoning` | `claude-opus-4-8`, then `claude-opus-4-5` | `claude-sonnet-5` (note: weaker reasoning) | $0.10 |
| `workhorse` | `claude-sonnet-5`, then `claude-sonnet-4-5` | `minimax/minimax-m3` (default) | $0.04 |
| `cheap-fast` | `minimax/minimax-m3` (default), then `claude-haiku-4-5` | local Ollama (free) | $0.006 |

**Banned on Nous too:** `claude-fable-5` — even though it's the strongest model on the portal. Loops never route to it.

### Hermes runtime behavior (preferred, best-effort)

When running a loop **inside the Hermes desktop app** or any agent that routes through Nous Portal, for each phase:

1. Read that phase’s `model_class` from `loop.yaml`.
2. Resolve the preferred slug from the table above.
3. **`high-reasoning`:** Dispatch the phase via **delegate_task** (subagent) with `model: claude-opus-4-8` when the product allows it. If delegation or that slug is unavailable, run the phase in the current session with `minimax/minimax-m3` (the default) and continue — do not block the loop. Tell the user in one short line that you fell back to the default.
4. **`workhorse`:** Run in the main session with `minimax/minimax-m3` (default), or delegate to a subagent with `claude-sonnet-5` for tasks that benefit from stronger instruction-following.
5. **`cheap-fast`:** Stay in the main session with `minimax/minimax-m3`. For trivial handoffs, prefer local Ollama if the user has it running.
6. **Fallback protocol:** If the chosen model fails (rate-limit, quota, "model not available"), retry the same step with `minimax/minimax-m3` (the default, always available) and tell the user in one line. Do not stall asking permission.
7. **Never select Fable.** The ban applies to Nous Portal too.
8. **Cost attribution:** when a subagent finishes, surface the model used and approximate cost in the loop's progress update, so the user can see spend per phase.

### Cron delegation pattern (Hermes only)

For long-running or off-loop `high-reasoning` work, schedule it as a `cronjob` with `model: claude-opus-4-8` and `deliver: origin` so the result comes back to the chat. This is the cheapest way to get a `high-reasoning` phase in Hermes without burning a long session.

```bash
hermes cron run <job-id> --model claude-opus-4-8
```

## Where classes live

Each loop’s `loop.yaml` sets `model_class` per phase. Loop `loop.md` files summarize Cursor behavior and point here (`LOOPS_ROOT/adapters/MODEL_CLASSES.md`).
