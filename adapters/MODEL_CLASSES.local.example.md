# Model classes — local override (example)

Copy this file to `MODEL_CLASSES.local.md` in the same folder. That path is gitignored.

When this file exists, agents **must prefer it** over `MODEL_CLASSES.md` for class → model mapping, bans, and extra platforms.

---

## Bans (optional)

List models you never want loops to select, e.g.:

```text
banned:
  - some-expensive-model
  - vendor-model-fast
```

## Class → model (Cursor) — optional overrides

Only include rows you want to change. Unspecified classes keep the portable defaults.

| Class | Prefer | Fallback |
|---|---|---|
| `high-reasoning` | Auto, then Claude Opus via Task/subagent | strongest available on plan |
| `workhorse` | Auto | — |
| `cheap-fast` | Auto | — |

## Extra platform (optional)

Add a section for any other agent host you use (desktop app, portal, local router). Example shape:

### Class → model table (MyAgentHost)

| Class | Prefer (in order) | Fallback |
|---|---|---|
| `high-reasoning` | `provider/strong-model` | `provider/mid-model` |
| `workhorse` | `provider/mid-model` | `provider/cheap-model` |
| `cheap-fast` | `provider/cheap-model` | local |

### Runtime behavior

1. Read `model_class` from `loop.yaml`.
2. Resolve the preferred slug from the table above.
3. For `high-reasoning`, prefer a subagent/delegate when the product allows.
4. On failure, fall back and tell the user in one line — do not block the loop.
