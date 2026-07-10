# Changelog

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
