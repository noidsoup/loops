# Changelog

## 0.1.3 — 2026-07-15

- **Recommended stack:** `MODEL_CLASSES.local.example.md` is now a concrete Cursor + Claude Code recipe (Opus 4.8 for high-reasoning; Cursor Auto / Claude Sonnet+Haiku for the rest; explicit bans). README points at the copy step.

## 0.1.2 — 2026-07-14

General-audience docs + configurable model stack:

- **README:** Rewritten for a general audience (why, quick start, catalog, HTTPS clone URLs).
- **Model classes:** Portable defaults in `adapters/MODEL_CLASSES.md` (Cursor Auto + Claude advisory). Personal stacks/bans live in gitignored `adapters/MODEL_CLASSES.local.md` (see `.local.example.md`). Agents prefer local when present.
- **Scrub:** Hermes / Nous / Fable removed from shared docs and loop blurbs; pack disambiguation is skill-pack-agnostic.
- **Install awareness:** Points at defaults + local override; lists `de-ai-ify`.

## 0.1.1 — 2026-07-10

Quality / ease-of-use audit fixes:

- **Personas:** `sar` and `adversarial-gate` now instruct agents to **Read** `LOOPS_ROOT/personas/<name>.md` before each persona step.
- **Emit:** Always namespace as `loops-*`; join full YAML descriptions; omit empty `globs:`; validate `name` / `model_class`; `--check` and `--help`; when repo is cloned as `.loops/`, emit into the **project** root.
- **Install:** Per-project Claude awareness (`INSTALL-CLAUDE.md`); `--dry-run` / `--help` on `install-global.js`; install sources use prefixed emit output.
- **Dispatcher:** Softened “never names a loop”; design-vs-diff routing rule; `LOOPS_ROOT` paths; YAML labeled as entry router (not meta-loop).
- **Triggers:** Narrowed TDD / reproduce-and-fix; removed overlapping “use the loops” from `use-the-loop` YAML.
- **Docs:** Single model-class source (`adapters/MODEL_CLASSES.md`); best-effort (not mandatory) Task/subagent language; README install decision tree.
- **Tooling:** `package.json`, `npm test`, GitHub Actions CI, `schema/loop.schema.json`, eval prompt cleanup.

## 0.1.0 — 2026-07-10

Initial catalog: dispatcher, nine loops, personas, global Cursor + Claude Code install, model classes.
