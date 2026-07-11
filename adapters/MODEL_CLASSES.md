# Model classes (loops)

Shared map for phase-level `model_class` on each loop. Canonical preference order is per-platform: **Cursor** (table below) is preferred when available, **Hermes / Nous Portal** is preferred when running inside Hermes desktop or any agent that routes through Nous, **Claude Code** treats the same classes as **advisory** (see bottom).

**Banned (all platforms):** any Fable / `fable-5` / `claude-fable-*` model. Never recommend or use them. This applies to Nous Portal too — even though `claude-fable-5` is the most expensive model on the portal, the loops ban is absolute.

## Class → model table (Cursor)

**Two usage pools.** Cursor splits models into two pools per <https://cursor.com/docs/models-and-pricing>:

- **First-party models pool** — "Significantly more included usage with **Auto, Composer 2.5, and Grok 4.5**." Auto is a meta-router that selects among the first-party models to balance intelligence, cost, and reliability. All workhorse / cheap-fast work and most high-reasoning work should run on this pool.
- **API pool** — Charged at the model's API rate. This is where the third-party models live (Claude, GPT, Gemini Pro). Use only when the task truly needs a specific third-party model's strengths, or when the first-party pool is exhausted.

**Default to Auto for everything.** Auto is the canonical Cursor default: it draws from the first-party pool (cheap, included with the plan) and routes intelligently. Only override Auto to a specific model when you have a reason.

**`Composer 2.5 (Fast)` is banned.** It exists (see the pricing table) but costs **6× more per input token** than regular Composer 2.5 ($3 vs $0.50 per 1M) and **6× more per output token** ($15 vs $2.50). Same ban applies to any other `*-fast` variant from any vendor.

**`Grok 4.5 (Fast)` is also banned** ($4/$18 per 1M — 2× the regular Grok 4.5). Cursor's "fast" variants are an anti-pattern: they cost more, not less, than the regular model. The ban covers all of them.

| Class | Default (Auto) | Explicit override (when needed) | Pool used |
|---|---|---|---|
| `high-reasoning` | `Auto` (will pick from Composer 2.5 / Grok 4.5) | `Claude Opus 4.8` (API pool) or `Gemini 3.1 Pro` (API pool) | First-party; API only if user opts in |
| `workhorse` | `Auto` | — (let Auto pick) | First-party |
| `cheap-fast` | `Auto` | — (let Auto pick) | First-party |

**Why Auto instead of hand-coded fallbacks:** Auto's router reacts to real-time first-party pool state. If Composer 2.5 hits a usage cap but Grok 4.5 has headroom, Auto uses Grok — without loops having to model the swap. The hand-coded "primary → fallback" chain I had before can't react to live pool state and double-counts the same model across classes.

**Fable ban:** `Claude Fable 5` is API-pool only ($10/$50 per 1M — the most expensive Cursor model), so Auto will never pick it. Loops never selects Fable explicitly either. If a phase is asked to use Fable, refuse and route to Auto or Claude Opus 4.8.

### Override rules (when to leave Auto)

Override Auto → specific model **only** when the task meets one of these criteria:

1. **High-reasoning + needs deepest reasoning:** dispatch to `Claude Opus 4.8` via Task/subagent. Costs API pool. The user sees spend in real time on the usage dashboard.
2. **High-reasoning + Google knowledge work:** `Gemini 3.1 Pro` via Task/subagent. Same API-pool cost warning.
3. **Any other reason (saving, Fable ban enforcement, etc.):** stay on Auto.

Never override Auto to `Claude Fable 5` for any reason. Never override Auto to `Composer 2.5 (Fast)` or `Grok 4.5 (Fast)` for any reason.

### Cross-vendor fallback (last resort)

When the entire first-party pool is exhausted (Auto errors out, both Composer 2.5 and Grok 4.5 at quota) AND no API pool is available (no third-party model selected, or user has chosen to stay on first-party), the last-resort fallback is **off Cursor**:

| Class | Cross-vendor fallback |
|---|---|
| `high-reasoning` | `claude-opus-4-8` via Nous Portal (~$0.10/phase) — see Hermes section. |
| `workhorse` | `claude-sonnet-5` via Nous Portal (~$0.04/phase). |
| `cheap-fast` | `minimax/minimax-m3` via Nous Portal (free, always on). |

If a phase is in a project running on Claude Code, the "cross-vendor fallback" stays on Claude (`claude-opus-4-5` for high-reasoning, etc.) — see Claude Code section below.

### Cursor runtime (preferred, best-effort)

When running a loop **in Cursor**, for each phase:

1. Read that phase’s `model_class` from `loop.yaml` (or the loop's Model selection section).
2. **Default: dispatch with `model: "Auto"`.** Let Cursor's first-party router pick the right model for the actual task and current pool state.
3. **Override to a specific model** only if the override rules above apply. Tell the user in one line when you do this ("Plan phase: dispatched to Claude Opus 4.8 via API pool, ~$0.10 expected"). API-pool selections should always be announced.
4. **For high-reasoning phases,** prefer dispatching the phase via **Task / subagent** with `model: "Auto"` (or the override). Subagent lets the main session stay on a cheaper context.
5. **For workhorse / cheap-fast,** stay in the main session with `model: "Auto"`. Don't dispatch subagents for routine work.
6. **Fallback protocol:** If Auto returns an error or "model not available" for the current phase — **do not retry Auto blindly.** Tell the user in one line ("Auto unavailable; falling back to Nous Portal") and route to the cross-vendor fallback. Do **not** stall asking permission.
7. **Never select Fable** — even if Fable is the only Cursor model with capacity, stay on Auto or fall off Cursor.
8. **Never select `*-fast` variants** — Composer 2.5 (Fast) and Grok 4.5 (Fast) are explicitly banned.
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
