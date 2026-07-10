# Personas

Personas are **review lenses** — short role prompts the agent adopts for a step inside a loop. They are **not** top-level dispatcher options. You never route "run skeptic"; you run `sar` or `adversarial-gate`, which rotate personas per round.

## Where they live

Canonical files: `LOOPS_ROOT/personas/<name>.md`. Portable — no Hermes, cursor-loop, or private vault dependency.

**Contract:** `sar` and `adversarial-gate` must **Read** the persona file before adopting that lens. Do not improvise from the name alone.

## Catalog

| Persona | Lens |
|---|---|
| `skeptic` | Challenge the problem statement and assumptions. |
| `security-auditor` | Trust boundaries, injection, authn/z, secrets. |
| `simplicity-advocate` | Removable complexity; simplest correct shape. |
| `perf-critic` | Hot paths, algorithmic waste, scale. |
| `regression-hunter` | Breakage for callers, migrations, behavior changes. |
| `edge-case-analyst` | Boundaries, empty/null, concurrency, malformed input. |
| `a11y-advocate` | Keyboard, focus, semantics, screen readers, contrast, ARIA. |
| `api-contract-guardian` | Breaking changes, versioning, schema drift, client compatibility. |
| `dx-critic` | Errors, docs, onboarding friction, confusing APIs, missing examples. |

## Used by

| Loop | How personas are used |
|---|---|
| `sar` | Spec as `skeptic`; attack candidates rotating `security-auditor`, `simplicity-advocate`, `perf-critic`; light simplicity bias at judge. |
| `adversarial-gate` | Rounds default to `security-auditor` → `regression-hunter` → `edge-case-analyst`; swap in `a11y-advocate` / `api-contract-guardian` / `dx-critic` / `perf-critic` / `simplicity-advocate` when the artifact warrants it. |

Other loops may optionally adopt a persona for a single check; they do not appear in the dispatcher table.
