# Model classes (loops)

Shared map for phase-level `model_class` on each loop. Canonical preference order is per-platform: **Cursor** (table below) is preferred when available, **Hermes / Nous Portal** is preferred when running inside Hermes desktop or any agent that routes through Nous, **Claude Code** treats the same classes as **advisory** (see bottom).

**Banned (all platforms):** any Fable / `fable-5` / `claude-fable-*` model. Never recommend or use them. This applies to Nous Portal too — even though `claude-fable-5` is the most expensive model on the portal, the loops ban is absolute.

## Class → model table (Cursor)

**Different models for different classes.** Cursor exposes one slug per model (no `*-thinking-high` or `*-fast` slug variants in the picker or API). Reasoning effort is implicit in which model you pick, not a parameter. The current canonical Cursor model list is at <https://cursor.com/docs/models> — the table below is verified against that page.

**`composer-*-fast` is banned** (future-proofing): if Cursor ever ships a `composer-2.5-fast` or any other `*-fast` variant, never route to it. The same rule applies to any `*-fast` variant from any vendor. Today no such variant exists, but the ban is preserved so a future Cursor release doesn't catch loops off-guard.

| Class | Primary model | Fallback (if primary unavailable) | Notes |
|---|---|---|---|
| `high-reasoning` | `Claude Opus 4.8` | `Grok 4.5` (use when Opus usage is up) | 300k context, 1M in Max Mode. The strongest available non-Fable model in Cursor. |
| `workhorse` | `Grok 4.5` | `Composer 2.5` (Cursor's in-house, use when Grok usage is up) | 256k context. The Cursor × SpaceXAI partnership model. |
| `cheap-fast` | `Composer 2.5` | `Gemini 3.5 Flash` (use when Composer usage is up) | 200k context. Cursor's in-house agentic model; fastest, cheapest Cursor-side option. |

**Fable ban:** `Claude Fable 5` exists in Cursor but is **never** routed to by loops — same ban as on Nous Portal. If a `high-reasoning` phase's only "available" model is Fable, the agent must fall back to `Grok 4.5`, not use Fable.

### Cross-vendor fallback (last resort)

When the entire Cursor chain above is exhausted (quota, rate-limit, "model not available"), the last-resort fallback is **off Cursor**:

| Class | Cross-vendor fallback |
|---|---|
| `high-reasoning` | `claude-opus-4-8-thinking-high` via Nous Portal (~$0.10/phase) — see Hermes section. |
| `workhorse` | `claude-sonnet-5` via Nous Portal (~$0.04/phase). |
| `cheap-fast` | `minimax/minimax-m3` via Nous Portal (free, always on). |

If a phase is in a project running on Claude Code, the "cross-vendor fallback" stays on Claude (`claude-opus-4-5` for high-reasoning, etc.) — see Claude Code section below.

### Cursor runtime (preferred, best-effort)

When running a loop **in Cursor**, for each phase:

1. Read that phase’s `model_class` from `loop.yaml` (or the loop's Model selection section).
2. Resolve the primary slug from the table above.
3. **`high-reasoning`:** Prefer dispatching the phase via **Task / subagent** with `model: "Claude Opus 4.8"`. If the primary is unavailable (usage up, rate-limited, "model not available"), fall back to `Grok 4.5`, then cross-vendor. Never block the loop.
4. **`workhorse`:** Implement in the main agent, or a workhorse subagent with `model: "Grok 4.5"`. Fallback to `Composer 2.5` if Grok usage is up; cross-vendor if both unavailable.
5. **`cheap-fast`:** Stay in the main session with `model: "Composer 2.5"`. Fallback to `Gemini 3.5 Flash` if Composer usage is up; cross-vendor if both unavailable.
6. **Fallback protocol:** If the chosen model fails due to usage limits, quota, "model not available", or similar — **immediately retry the same step** with the class's fallback. Tell the user in **one short line** which model you fell to. Do **not** stall asking permission.
7. If on last-resort cross-vendor, **continue** — do not loop forever trying banned or unavailable models.
8. **Never select Fable.** Even if Fable is the only Cursor model with capacity, fall back to Grok 4.5 instead.
9. **Max Mode:** enable Cursor's Max Mode for high-reasoning phases that need >200k context (most Cursor models support 1M in Max Mode). Do not enable Max Mode for workhorse or cheap-fast — it costs more and doesn't help.

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
