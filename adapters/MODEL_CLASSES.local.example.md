# Model classes — recommended local override

Concrete Cursor + Claude Code recipe for `high-reasoning` / `workhorse` /
`cheap-fast` (not the soft Auto defaults). Copy it; when present, agents
**must prefer** this file over `MODEL_CLASSES.md`:

```bash
cp adapters/MODEL_CLASSES.local.example.md adapters/MODEL_CLASSES.local.md
# or, after global install:
cp ~/.loops/adapters/MODEL_CLASSES.local.example.md ~/.loops/adapters/MODEL_CLASSES.local.md
```

`MODEL_CLASSES.local.md` is gitignored — edit freely on your machine.

---

## Bans

Never select:

- Any Fable / `fable-5` / `claude-fable-*` model
- Cursor `*-fast` / “(Fast)” variants when they cost more than the regular model
  (e.g. Composer 2.5 Fast, Grok 4.5 Fast)

---

## Class → model (Cursor)

| Class | Prefer | Fallback |
|---|---|---|
| `high-reasoning` | **Claude Opus 4.8** via Task/subagent (API pool) | Claude Opus 4.5, then strongest non-banned model on the plan |
| `workhorse` | **Auto** (first-party pool) | Composer 2.5 or Grok 4.5 if Auto is unavailable |
| `cheap-fast` | **Auto** | same as workhorse |

Announce API-pool spend in one line when you leave Auto for Opus
(“Plan phase: Claude Opus 4.8 via Task, API pool”).

### Cursor runtime

1. Read the phase’s `model_class` from `loop.yaml`.
2. **`high-reasoning`:** Dispatch via Task/subagent with Claude Opus 4.8 when
   the product allows a model override. Do not stay on Auto for these phases
   unless Opus (and fallbacks) are unavailable.
3. **`workhorse` / `cheap-fast`:** Stay in the main session on Auto.
4. If the chosen model fails (quota / unavailable), fall back per the table
   and tell the user in one line. Do not block the loop.
5. Max Mode: only for high-reasoning phases that need very large context.

---

## Class → model (Claude Code)

Claude Code often cannot switch models mid-session. Prefer the right model
**when starting the session** (or open a second session for a phase). Use the
table below whenever `/model` or a session picker is available.

| Class | Prefer | Fallback |
|---|---|---|
| `high-reasoning` | **Claude Opus 4.8** | Claude Opus 4.5, then Claude Sonnet 5 |
| `workhorse` | **Claude Sonnet 5** | Claude Sonnet 4.5, then current session model |
| `cheap-fast` | **Claude Haiku 4.5** | Claude Sonnet 5 (if Haiku unavailable) |

### Claude Code runtime

1. Read the phase’s `model_class` from `loop.yaml`.
2. **`high-reasoning`:** If the current session is not Opus-tier, tell the user
   in one line to switch (`/model`) or continue in a second Opus session for
   that phase. Prefer Opus for specs, attacks, and verdicts — do not silently
   stay on a weak model when switching is possible.
3. **`workhorse`:** Prefer Sonnet in the current session. Implement / edit here.
4. **`cheap-fast`:** Prefer Haiku for handoffs and summaries when switchable;
   otherwise stay on the current session and keep the output terse.
5. If you cannot switch, note it once and continue — do not block the loop.
6. Never select a banned model even if it appears in the picker.

---

## Optional: extra agent host

If you also run loops inside another agent (desktop app, portal, local router),
add another table with that host’s slugs. Keep the Cursor and Claude Code
sections above as the defaults for those products.
