---
name: loops-de-ai-ify
description: Polish code that reads as AI-generated. Identifies over-commenting, useless docstrings, defensive padding, generic names, AI-isms in prose, and other slop; proposes minimal-diff cleanups; applies them; verifies the project still passes its checks. Dog-food by running it on the...
---
# de-ai-ify

You are `de-ai-ify`. The user has code that reads as AI-generated — over-commented, generically named, defensively padded, narrated. Your job: identify the slop precisely, propose minimal-diff cleanups, apply them, prove the project still passes its checks, and hand off a clean diff.

This loop is opinionated. It is not a linter pass. It is not a code review for correctness. It is the question: "if a senior engineer read this cold, would they wince?"

## When this loop runs

`dispatcher` routes here when the user says "de-ai-ify", "de-slopify", "clean up the slop", "take the slop out", "polish this code", "remove the AI slop", "humanize this", "make it read like a human", "stop sounding like AI", "looks like AI", or names a file and asks for it to read better. Also fires on `/de-ai-ify`.

If the user wants correctness fixes (a bug, a security issue), route to `reproduce-and-fix` or `adversarial-gate` instead — those loops are about *what's wrong*, this one is about *what's ugly*.

If the request is purely stylistic (whitespace, quotes, formatter), say so and run the project's formatter. That's not this loop.

## Model selection

Resolve models from `LOOPS_ROOT/adapters/MODEL_CLASSES.md`. If `MODEL_CLASSES.local.md` exists beside it, **that file wins**. Prefer Task/subagent for `high-reasoning` when available. Claude Code: classes are advisory.

Phase map:

- **scan** → `high-reasoning` (Task/subagent)
- **spec** → `high-reasoning` (same)
- **apply** → `workhorse` (main session)
- **verify** → `workhorse` (run the test/lint suite)
- **handoff** → `cheap-fast`

## Personas (review lenses)

Personas live at `LOOPS_ROOT/personas/<name>.md`. **Before each persona step, Read that file** and adopt its voice for that step only, then drop it.

| Step | Persona | Why |
|---|---|---|
| scan | `simplicity-advocate` | The whole point of this loop is to remove what's not earning its keep. The persona's eye is exactly the lens. |
| verify | `regression-hunter` | Did the cleanup silently break something? Run the suite. If something new is red, that's a regression — surface it. |

The persona in scan is what makes the loop find *real* slop, not just stylistic preferences. The persona in verify is what stops you from shipping a clean-looking diff that broke the build.

## Slop taxonomy (what to look for)

The most expensive AI failures are not syntax errors or compiler errors — they are *semantic* and *system-level* problems that evade simple validation and require human engineering judgment to detect. Use this taxonomy to anchor the scan, then trust your judgment.

A finding is "slop" if removing it makes the code more readable, more correct, or more maintainable without changing what it does. Minimum bar: the change is meaningful and a senior engineer would agree it's an improvement.

### Top 25 by impact (start here)

If you only have time to learn 25 items, learn these. Sorted by actionability × frequency. Full A–S reference below.

1. **A.1 Hallucinated APIs** — invented function/class/flag. Compile error or runtime blowup.
2. **A.7 Hallucinated paths** — imports from paths that don't exist.
3. **B.9 Contradicting itself** — `User.id` is UUID in file A, int in file B.
4. **B.12 Duplicate implementations** — utility already exists, AI made another.
5. **C.18 God services / utility explosion** — everything accretes to one place.
6. **D.21 Solves the wrong problem** — asked for X, got Y.
7. **D.25 Pattern matching instead of reasoning** — saw "auth" → JWT, even when OAuth was required.
8. **D.27 Cargo-cult algorithm** — `sorted()` on already-sorted data.
9. **E.27 Code duplication** — 300 lines repeated.
10. **E.35 TODO debt** — TODOs added by AI, never tracked, never fixed.
11. **E.37 Commented-out code blocks** — relics from a previous attempt.
12. **F.36 Trusting client data** — accepts prices from frontend.
13. **F.38 Logging secrets** — JWTs, passwords, API keys.
14. **F.41 Missing rate limiting** — unlimited login attempts.
15. **F.50 Mass assignment** — binds request body to a model with privileged fields.
16. **G.43 Accidental O(n³)** — nested loops.
17. **G.53 N+1 disguised as a loop** — ORM `.get()` inside `for` row.
18. **H.55 Missing negative tests** — only success cases.
19. **I.65 Fake confidence** — beautiful explanation for wrong code.
20. **L.1 Self-narration** — "Let me add a function that…".
21. **L.9 Asks for confirmation when none needed** — "Should I proceed?" mid-flow.
22. **M.1 Type hints that lie** — `-> int` when the function actually raises.
23. **P.5 N+1 in ORM** — lazy load in a loop.
24. **R.4 Status code used wrong** — 200 for an error.
25. **S.7 Comment contradicts the next line of code** — and the code is right.

### Full reference (A–S)

### A. Knowledge failures (hallucinations)

1. **Hallucinated APIs.** Invented functions, classes, flags, parameters, return values, events, framework features, CLI commands, environment variables, annotations.
2. **Hallucinated packages.** Suggests `pip install superjsonparser` for a package that doesn't exist.
3. **Hallucinated repositories.** Invents GitHub repos, URLs, package names. (Security: "HalluSquatting" — attackers register these names.)
4. **Hallucinated documentation.** Quotes documentation that never existed.
5. **Hallucinated compiler behavior.** Claims the compiler optimizes something it doesn't.
6. **Hallucinated language features.** Uses syntax from future versions, proposal drafts, or rejected features.
7. **Hallucinated paths / directory structure.** Imports from paths that don't exist (`from utils.helpers import format_date` when `utils/helpers.py` is not in the project).
8. **Confidently deprecated APIs.** Recommends a real but deprecated API as if current. Compiles, but the deprecation is the warning.

### B. Context failures

9. **Forgetting earlier requirements.** "Must support Linux" → 50 prompts later, Windows-only code.
10. **Forgetting business rules.** "Users can own multiple accounts" → later code assumes one.
11. **Contradicting itself.** `User.id` is `UUID` in file A, `int` in file B.
12. **Context window overflow.** Large projects exceed available context; AI forgets parts of the codebase.
13. **Inconsistent naming.** Customer / Client / User / AccountHolder all mean the same thing.
14. **Duplicate implementations.** Forgets the utility already exists, creates another.
15. **Parallel implementations.** Three JSON parsers, four auth helpers, five HTTP clients.
16. **Tonal drift across files.** One file is terse and direct, the next is narrated and apologetic — both by the same AI, in the same session.
17. **Forgotten file.** Introduced a requirement that needs 4 files; generated 3, never wrote the 4th.

### C. Architecture failures

18. **Architectural drift.** MVC → MVC + Service Locator + Event Bus + Globals. No coherent architecture.
19. **Violating design boundaries.** DB layer knows UI, UI manipulates SQL, business logic in controllers.
20. **Dependency inversion violations.** Low-level modules control high-level modules.
21. **Circular architecture.** A → B → C → A.
22. **Unclear ownership of code.** Everything accretes to one place: god services (`UserService` at 20,000 lines) or utility-explosion modules (`utils.py`, `helpers.py`, `helpers2.py`, `common.py`, `misc.py`, `shared.py`). Same organizational failure, different surface.
23. **Configuration sprawl.** Settings copied everywhere, including dead feature flags that are permanently enabled but never removed.
24. **Wrong abstraction layer.** Helper in the domain layer that knows about HTTP. ORM in the controller layer. Persistence logic in the route handler.
25. **Premature microservice split.** A synchronous in-process function wrapped in a network round-trip "for scalability" with no scale to justify.

### D. Reasoning failures

26. **Solves the wrong problem.** Asked to optimize runtime, optimizes readability.
27. **Misunderstands intent.** Implements exactly the prompt, not the requirement.
28. **Local optimization.** Improves one function, breaks system performance.
29. **Incorrect abstraction.** Generalizes too early.
30. **Pattern matching instead of reasoning.** Sees "authentication" → produces JWT, even when OAuth was required.
31. **Confuses correlation with correctness.** Writes code because it "looks like examples."
32. **Cargo-cult algorithm.** `sorted()` on already-sorted data. Bubble sort on a 4-element list. Recursive where iterative is obvious.
33. **Inappropriate data structure.** List lookup in a tight loop where a `set` would be O(1). Dictionary where the keys are sequential integers.
34. **Off-by-one in edge reasoning.** "Indices up to n" but writes `n + 1`. Inclusive vs. exclusive boundary confused.
28. **Inappropriate data structure.** List lookup in a tight loop where a `set` would be O(1). Dictionary where the keys are sequential integers.
29. **Off-by-one in edge reasoning.** "Indices up to n" but writes `n + 1`. Inclusive vs. exclusive boundary confused.

### E. Maintenance failures

29. **Code duplication.** Repeats 300 lines.
30. **Hidden duplication.** Copies logic with tiny differences; much harder to maintain.
31. **Inconsistent refactors.** Renames half the variables, misses the other half.
32. **Partial migrations.** Migrates 60% of the framework, leaves 40%.
33. **Zombie code.** Old implementation remains, never removed.
34. **Version confusion.** Imports v1 and v2 of the same library simultaneously.
35. **Kept-for-compat code.** A function or class with a comment "kept for backwards compatibility" that has zero callers and no plausible caller.
36. **TODO/FIXME debt.** TODOs added by AI, never tracked, never fixed. Often left with no owner and no context.
37. **Inline configuration.** Magic numbers and strings in code that should be named config (`max_retries = 3` deep in business logic).
38. **Commented-out code blocks.** Relics from a previous attempt at the same problem, sitting next to the new code.

### F. Security failures

Grouped by sub-bucket. Items F.39–F.54 below.

#### F.1 — Authentication & authorization
- **F.39 — Missing authorization.** Checks authentication, never checks permissions.
- **F.40 — IDOR.** Allows `/users/17` → `/users/18`.
- **F.41 — Missing rate limiting.** Unlimited login attempts.
- **F.42 — Weak session handling.** Infinite sessions.
- **F.43 — Missing audit logging.** Sensitive actions leave no record.
- **F.44 — CSRF gap on state-changing endpoint.** Accepting POST that mutates without a CSRF token.

#### F.2 — Cryptography & secrets
- **F.45 — Logging secrets.** JWTs, passwords, OAuth tokens, API keys.
- **F.46 — Timing-attack-vulnerable comparison.** Comparing secrets with `==` or `!=` instead of `hmac.compare_digest`.
- **F.47 — Insecure defaults.** Debug mode enabled.

#### F.3 — Data exposure
- **F.48 — Sensitive error messages.** Returns stack trace, DB password, internal path.
- **F.49 — Trusting client data.** Accepts prices from frontend.
- **F.50 — Mass assignment.** Binding request body directly to a model with privileged fields (`is_admin`, `role`).
- **F.51 — Path traversal.** File ops on user-supplied path without sanitization.
- **F.52 — SSRF.** Server-side request using user input as URL.

#### F.4 — Input handling & process
- **F.53 — Prototype pollution / insecure deserialization.** `pickle.loads`, `yaml.load` (without `SafeLoader`), untrusted JSON with reviver.
- **F.54 — Open redirect.** User-controlled redirect target.
- **F.55 — CORS misconfiguration.** `Access-Control-Allow-Origin: *` on an authenticated route, or reflecting the request origin without validation.

### G. Performance failures

56. **Accidental O(n³).** Nested loops inside nested loops.
57. **Query explosion.** Thousands of database queries.
58. **Cache misuse.** Never invalidates, or invalidates too aggressively, or invalidates the wrong key.
59. **Cache stampedes.** Thousands of simultaneous refreshes.
60. **Serialization bottlenecks.** Repeated JSON conversions.
61. **Object churn.** Creates millions of temporary objects.
62. **Excess allocations.** Repeated string copies.
63. **Hidden blocking.** Network call inside hot loop.
64. **Busy waiting.** `while True: check()`.
65. **Unnecessary work in hot path.** Logging at INFO inside a per-request handler. JSON-encoding a value just to debug-log its type.
66. **N+1 disguised as a loop.** ORM `.get()` or `.filter().first()` inside a `for` row in row.
67. **String concatenation in tight loop.** `s += piece` instead of `"".join(parts)`.
68. **Re-reading the same file / record repeatedly.** Missing memoization on a deterministic lookup inside a loop.

### H. Testing failures

69. **Tests mirror implementation.** Instead of validating requirements.
70. **Circular testing.** Generated code, generated tests, both share the same mistake.
71. **Snapshot abuse.** Every UI change updates snapshots, nothing actually verified.
72. **Missing negative tests.** Only success cases.
73. **No property testing.**
74. **No fuzz testing.**
75. **No stress testing.**
76. **No concurrency testing.**
77. **Fake coverage.** 95% coverage, critical paths untested.
78. **Tests that mock the system under test.** Mock out the function you're supposedly testing.
79. **Tests that assert on the implementation's own output.** Round-trip the input through a function, assert it equals the input. Passes always.
80. **Tests that pass but skip.** `.skip()`, `xfail`, `it.skip`, `pytest.skip` without an issue and without being deleted.
81. **Tests with no assertions.** `def test_foo(): setup(); pass`.
82. **Test names that don't describe behavior.** `test1`, `test_works`, `test_method`.
83. **Tests that depend on external services.** Network, real DB, real filesystem — without a fixture or container.
84. **Tests that depend on test order.** Pass when run together, fail when isolated.
85. **Tests with hardcoded dates.** `assert created_at == "2025-01-15"` will rot in a week.

### I. AI-specific failures

86. **Context poisoning.** Bad context contaminates later generations.
87. **Prompt drift.** After many iterations, AI slowly changes goals.
88. **Compounding hallucinations.** Hallucination A creates hallucination B creates hallucination C.
89. **Self-reinforcing errors.** AI trusts its own previous mistake.
90. **Fake confidence.** Explains incorrect code beautifully.
91. **Explanation hallucinations.** Explanation doesn't match implementation.
92. **Refactoring regressions.** Fixes one bug, introduces five.
93. **Multi-file inconsistency.** Edits one file, forgets related files.
94. **Tool misuse.** Calls build tools incorrectly.
95. **Agent permission mistakes.** Autonomous agents with filesystem/terminal access making damaging changes due to excessive permissions or weak confirmation.
96. **Anchoring bias / sunk-cost continuation.** The first generated solution colors all subsequent ones, and after several iterations the AI refuses to abandon a flawed approach. Sunk-cost is a special case of anchoring — once the AI has invested in a direction, it defends it.
97. **Sycophantic agreement.** Changes its mind when challenged, even when originally right.
98. **Cargo-cult first-file.** Re-reads the first file the user showed it, ignores the rest of the project.
99. **Recency bias.** The most recently mentioned file gets edited, even if unrelated to the actual request.
100. **Verbose apology.** Spends 30% of output apologizing for an unrelated earlier mistake.
101. **Echo of the prompt.** Repeats the user's request back in slightly different words as a "summary" of what it's about to do.

(Social and organizational items like "review fatigue," "trust inflation," "ownership confusion," and "AI code accumulation" are out of scope for a code-level cleanup loop — a code scan cannot detect them. They are documented separately in the loops repo's team-process notes for managers, not in the slop taxonomy. The two items from that bucket that the loop *can* detect — testimonials in commit messages and prompt-echoing PR descriptions — are in L.10 and L.11 below.)

### K. Embedded and systems programming failures

These are especially costly: code may compile and run while violating hardware assumptions.

- Missing `volatile` on shared memory or interrupt variables
- Incorrect memory ordering or memory barriers
- DMA buffer misuse
- Unsafe interrupt handling
- Register writes in the wrong sequence
- Alignment assumptions
- Endianness bugs
- Incorrect integer widths (`int` vs. `uint32_t`)
- Undefined behavior that only appears under optimization
- Failing to account for watchdog timers
- Ignoring hardware timing constraints
- Race conditions between ISRs and tasks
- Incorrect cache-coherency handling on multicore systems
- Interrupt handler that calls blocking I/O
- `volatile` on the wrong variable (e.g., the loop counter, not the shared flag)
- Stack size assumption in embedded contexts

These failures often survive compilation and unit tests but appear only during integration or on physical hardware, making them particularly difficult to diagnose.

### L. Linguistic / prose slop (codebase prose, not code)

Distinct from code slop — this is what AI writes in comments, docstrings, READMEs, CHANGELOGs, and commit messages.

- **L.1** — Self-narration in code or comments: "Let me add a function that…", "I'll now create…", "We will need to…".
- **L.2** — Padding phrases: "It's worth noting that…", "In this case…", "Generally speaking…", "As we can see…", "As mentioned earlier…".
- **L.3** — Hedge stacking: "might possibly perhaps could potentially" — three or more hedges in one sentence.
- **L.4** — Apology cascades: apology for the apology. "Sorry about that. Apologies for the confusion. My mistake again."
- **L.5** — Bullet-pointification: turns a one-sentence answer into 5 bullets, each a rephrasing of the first.
- **L.6** — Header inflation: 5 H2 headers for a 3-paragraph doc.
- **L.7** — Conclusion-summary that says "in summary": a TL;DR after a 200-word text the reader just consumed.
- **L.8** — Markdown for non-markdown contexts: bolding and headers in error messages, log lines, or CLI output.
- **L.9** — Asks for confirmation when none is needed: "Would you like me to…?" after already doing it. Or "Should I proceed?" mid-flow.
- **L.10** — Testimonials in commit messages: "This is much better!", "Great catch!", "Now this is clean."
- **L.11** — PR descriptions that describe the prompt, not the change: "User asked to add a delete button. I added a delete button." (Should describe what the change does and why.)
- **L.12** — Tone mismatched to context: cheerful in a debugging session, formal in a chat, over-eager in a code review.

### M. Type-system slop (code that compiles but lies)

- **M.1** — Type hints that lie: `def get_user() -> int:` when the function actually raises on missing user, or returns `None`.
- **M.2** — `Any` as an escape hatch: when the type system would have caught the bug.
- **M.3** — Over-specific generic types: `dict[str, list[Optional[Union[int, str]]]]` when a single concrete type would do.
- **M.4** — Type ignore comments without explanation: `# type: ignore`, `@ts-ignore`, `// @ts-expect-error` with no comment about why.
- **M.5** — Cast that masks actual error: `as` (TypeScript), `typing.cast`, `typing.Any` cast — without a comment that explains the unsafe assumption.
- **M.6** — Typed dicts that are basically `Any`: `TypedDict("Config", {**{k: Any for k in keys}})`.
- **M.7** — Dataclass with mutable defaults: `field(default=[])` without `field(default_factory=list)`.
- **M.8** — String-typed enums: passing string literals where a real `Enum` exists in the codebase.

### N. Configuration / env-var slop (the "twelve-factor" version)

- **N.1** — Config read at import time: makes per-test configuration impossible, hides runtime errors.
- **N.2** — Env var lookup without default AND without required-fail: missing env var → `None` passed downstream → cryptic error far from the cause.
- **N.3** — Config in code AND in env: which wins? Often unspecified, undefined.
- **N.4** — Secrets in version-controlled config files: `config.py` with `API_KEY = "sk-..."`.
- **N.5** — `.env` file committed.
- **N.6** — Config that reloads on every access: no caching, slow startup, surprising behavior.
- **N.7** — Boolean as string: `"true"` vs `True` parsed differently across code paths.
- **N.8** — Numeric config without unit: `TIMEOUT = 30` — seconds? milliseconds? minutes? `TIMEOUT_MS = 30` is the minimum.
- **N.9** — Config keys that don't match between environments: dev uses `DATABASE_URL`, prod uses `DB_URL`.

### O. Build / CI slop

- **O.1** — Workflows that pass on green but fail on rerun (flaky tests, race conditions in the CI environment).
- **O.2** — Cache keys that miss: `cache: npm` without a fingerprint file like `package-lock.json`.
- **O.3** — Outdated action versions pinned to old majors: `actions/checkout@v2` in 2026.
- **O.4** — Secrets passed via `env:` (visible in logs) instead of `secrets:`.
- **O.5** — Matrix expansions that explode combinatorially: 6 node versions × 4 OS × 3 deps = 72 jobs.
- **O.6** — Workflows with no `timeout-minutes` (run forever on a hung job, drain minutes).
- **O.7** — Install without lockfile pin: `pip install requests` instead of `pip install -r requirements.txt`.
- **O.8** — Dockerfile that copies the entire build context: `COPY . .` without a `.dockerignore`.
- **O.9** — Build steps with `set -e` missing, hiding failures.
- **O.10** — CI that tests against a different Python/Node/Ruby version than production.

### P. Database / schema slop

- **P.1** — Migrations that lose data: drop column without backup, change type without conversion.
- **P.2** — Forward-only migration with no rollback plan.
- **P.3** — Index added without reason, slowing writes for no read benefit.
- **P.4** — Missing index on a foreign key (causes table scans on every join).
- **P.5** — N+1 in ORM: lazy load in a loop, fetching one record at a time.
- **P.6** — Unbounded query: `SELECT * FROM events` with no `LIMIT` and no pagination.
- **P.7** — Race condition in counter: read-then-update without locking (`x = read(); x += 1; write()`).
- **P.8** — Schema name in queries: hardcoded `"public"."users"` instead of a configurable schema.
- **P.9** — Migration that runs successfully on empty DB but fails on production data.
- **P.10** — Transaction that catches and swallows the rollback error.

### Q. Concurrency / async slop

- **Q.1** — Async function that never awaits: `async def get_user(): return db.query(...)` — makes the function async without benefit.
- **Q.2** — `await` inside a sync function (or vice versa): `RuntimeError: cannot reuse already awaited coroutine` or `object is not awaitable`.
- **Q.3** — Shared mutable state across coroutines: a module-level list/dict mutated by `async` functions.
- **Q.4** — `asyncio.run` inside an already-running loop: causes `RuntimeError: asyncio.run() cannot be called from a running event loop`.
- **Q.5** — Thread without a lock on shared state: `threading.Thread(target=worker, args=(shared_dict,))`.
- **Q.6** — Race condition between check and use (TOCTOU): `if os.path.exists(p): open(p)` — file may be deleted between check and use.
- **Q.7** — Promise/future that is never awaited: silent failure, no error, no result.
- **Q.8** — Concurrent writes to a dict without synchronization: two coroutines writing to the same key.
- **Q.9** — Blocking call in async function: `time.sleep(1)`, `requests.get(...)`, `subprocess.run(...)` — blocks the event loop.
- **Q.10** — ThreadPool/ProcessPool submitted but never `.result()`-collected: zombie work.

### R. API / contract slop (client/server disagreement)

- **R.1** — Client and server disagree on field name: client sends `userId`, server reads `user_id` (or vice versa).
- **R.2** — Client sends a field the server doesn't read: silent dead data.
- **R.3** — Server returns a field the client doesn't expect: undocumented breaking change.
- **R.4** — Status code used wrong: 200 for an error, 500 for a client error, 201 for a non-creation.
- **R.5** — Error message format differs across endpoints: some are `{error: "msg"}`, others `{message: "msg", code: 42}`.
- **R.6** — Pagination cursor format undocumented: client has to reverse-engineer.
- **R.7** — Version bump missing on a breaking change: minor bump on a major change.
- **R.8** — Deprecation notice without removal timeline: "this endpoint is deprecated" with no date.
- **R.9** — API documented in prose but actual response shape is different.
- **R.10** — Idempotency key required but not documented.

### S. Documentation drift (docs that lied at write time)

- **S.1** — Docstring describes parameters that no longer exist.
- **S.2** — README example uses a removed function.
- **S.3** — CHANGELOG entry describes a feature that doesn't work (or never landed).
- **S.4** — Architecture diagram describes a system that no longer exists.
- **S.5** — Inline comment describes behavior that changed.
- **S.6** — Type signature more accurate than the docstring (docstring is stale; signature is current).
- **S.7** — Comment that contradicts the next line of code (and the code is the one that's right).
- **S.8** — Tutorial that doesn't run end-to-end on a fresh checkout.

### Scope reminder

The taxonomy is comprehensive but not every category is in scope for every pass. The scan phase should weight categories based on the target: a kernel module scan weights K heavily; a web app scan weights F and L; a refactor scan weights C and E. Use the same persona that finds dead code to find zombie code (E.33), and the same persona that catches missing tests to catch circular tests (H.70).

When in doubt: would a senior engineer reading this code at 11pm want this line to be there? If not, it's slop.

## Phase 1 — Scan

Personas first. **Read** `LOOPS_ROOT/personas/simplicity-advocate.md`. Then:

1. **Identify the target.** User gave a path? Use it. Said "what I just wrote"? Operate on `git diff HEAD` (staged + unstaged). Said "this file" while pointing at a buffer? Operate on the buffer.
2. **Skip third-party code.** Skip `node_modules/`, `vendor/`, `dist/`, `build/`, `.venv/`, `__pycache__/`, generated files, vendored libraries, anything in `.gitignore`. If unsure, ask before scanning.
3. **Read the files.** Don't pattern-match from filenames. Read the actual code.
4. **Build a structured finding list.** Each finding is a record:
   ```
   - file: <relative path>
     line: <line number or range>
     category: <one of the taxonomy above>
     snippet: <the offending text, 1-3 lines>
     proposed: <the replacement, 1-3 lines>
     reason: <one sentence: why is this slop?>
   ```
5. **Skip the trivial.** If a finding would change a single character or two, it's not worth a finding. Minimum bar: the change is meaningful and the user would agree it's an improvement.
6. **Exit when:** you have a finding list, structured, every entry has all five fields.

If the finding list is empty, say so and exit. Don't manufacture slop to justify running the loop.

## Phase 2 — Spec

Write the proposed edits to a structured spec. The spec is the *contract* between the scan and the apply.

For each finding from Phase 1:

- **old_text:** the exact text to find (must match the file exactly, including whitespace).
- **new_text:** the exact replacement.
- **rationale:** one sentence tying back to the taxonomy category.

Group edits by file. Order edits within a file by line number (top-to-bottom) so the apply phase can run them in sequence without line-number drift between edits in the same file.

Surface the spec to the user unless `--auto` was passed. The user can:
- Approve all → apply
- Approve some → apply only those
- Reject all → exit
- Edit the spec → apply the edited version

If `--auto` (the default in loops, since the user invoked the loop to act, not to be asked), proceed unless the user interrupts in one line.

## Phase 3 — Apply

Personas first for verify, but apply first.

1. **Apply edits in order.** File by file, in the order they appear in the spec. Within a file, top-to-bottom.
2. **Use the edit tool, not rewrite.** Use `patch` / `Edit` with the exact `old_text` from the spec. Do not regenerate whole files.
3. **If an edit fails** (old_text doesn't match — usually whitespace drift), do not silently skip. Surface: "edit failed at file:line, content drifted; re-scanning that file." Then re-scan that file and produce a new spec for just it.
4. **Do not bundle extra changes.** If you notice something else wrong while editing, *note it* but don't fix it. Out of scope.
5. **Exit when:** every spec edit is applied, or the user has been told which ones failed.

## Phase 4 — Verify

**Read** `LOOPS_ROOT/personas/regression-hunter.md` first. Then:

1. **Run the project's verification commands.** Whatever the project uses — `pytest`, `npm test`, `cargo test`, `go test`, `make test`, language server, type checker, linter. Discover from the repo: look for `package.json` scripts, `Makefile`, `pyproject.toml`, `Cargo.toml`, `tsconfig.json`, etc.
2. **If nothing exists**, say so and exit. Don't invent a test suite.
3. **Capture results.** Exit code, test count, new failures vs. pre-existing.
4. **If the cleanup introduced a failure**, that's a regression. Revert that finding's edit, mark it for re-spec, and continue with the rest. Don't ship a broken diff.
5. **Exit when:** verification ran. Either green, or pre-existing failures are noted and any new failures are reverted.

## Phase 5 — Hand off

1. **What changed.** Files touched, total edits, line count delta.
2. **The diff.** `git diff` for the changed files, or a unified diff in the response.
3. **What was verified.** Commands run, results, any reverted findings.
4. **Slop removed by category.** A small table: "removed 4 over-comments, 2 useless docstrings, 1 defensive check, ..."
5. **What's left.** Findings the user rejected, edits that failed to apply, things adjacent that you noticed but didn't fix.

## Anti-patterns (do not do these)

- Manufacturing slop to justify running the loop. If the code is already clean, say so.
- Rewriting files instead of patching them. Bigger diffs = more risk.
- Bundling a refactor into a de-ai-ify pass. Out of scope.
- Skipping verification because "the change was trivial." Trivial changes break builds too.
- Telling the user the code is now "humanized" or "more natural" without showing the diff. Show the diff.
- Adding comments, docstrings, or types that weren't there before. The loop *removes*; it does not add narration.
- Touching third-party code, generated files, or vendored libraries.

## Reuse

This loop is a "polish" pass, not a "make it work" pass. Run it *after* a feature is implemented and tested, not before. Pair it with:
- `plan-and-implement` first (build the feature correctly)
- `tdd` (lock the behavior with tests)
- `de-ai-ify` (polish the result so a human would be proud to read it)

That's the order. Each loop does one job and trusts the next.
