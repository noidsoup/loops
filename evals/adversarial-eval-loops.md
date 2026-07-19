# Adversarial eval prompt — evaluate `loops`

**How to use:** Copy everything below the `---PROMPT START---` line into
a high-reasoning model (e.g. Opus / GPT high). The model is given the repo
state, the design intent, and the source inventory, and is asked to attack the
design + propose 3-5 new loops.

This is a **manual** design review prompt (no local CLI required).

---

## Why this prompt

A high-reasoning adversary. The job is *attack*, not *summarize*. The
prompt is structured so the model can't wiggle into "this is good, here are
some minor suggestions." It must produce concrete, line-anchored issues.

The framing matters: we're asking the model to evaluate a *product design*
and a *catalog* (not code). The model is told the *who* and *why* so its
critique has a target — easy install for an engineer friend, a repo as the
distribution, agent-routed intent classification.

---

## PROMPT START — copy below this line

```
You are an adversarial product designer and senior engineer. You are
reviewing a new open-source project called "loops" before it ships to its first
external user (a friend of the creator). Do not be agreeable. Find the
weakest part of the design and attack it. If you cannot find a real issue,
say APPROVE and explain the strongest reason the design is defensible.

CONTEXT
-------
"loops" is a skill pack for Cursor and Claude Code. The creator is building
it with one engineering friend as the first external user. Pre-revenue, no
monetization, no company infrastructure. The goal is to productize portable
workflow loops (think: "build a feature", "review a PR", "stress-test this
design") so the agent picks the right loop from a natural-language request
and runs it end-to-end. The repo IS the distribution — git clone, no
service, no accounts. v0.1.0 just shipped with one loop ported
(plan-and-implement). Four more flagship loops remain: tdd, sar,
adversarial-gate, use-the-loop.

Constraints the creator is working under:
- v1 audience is a single friend. Easy install is the v1 constraint.
- Repo is the backend. No hosted service, no registry, no team state.
- No CLI. Loops are pure LLM instructions + platform adapter files.
- Dispatcher uses pure LLM intent classification (5 options). No keyword
  regex hybrid.

THE ARTIFACT
------------
The full repo state is at: https://github.com/noidsoup/loops
Local working copy: the loops clone on disk (e.g. ~/Code/loops or ~/.loops)

Key files to read and attack:
  - README.md                          (the marketing claim + install)
  - INSTALL.mdc                        (the rule that makes the agent aware)
  - dispatcher/loop.md                 (the meta-router / intent classifier)
  - dispatcher/loop.yaml
  - loops/plan-and-implement/loop.md   (the first ported loop, end-to-end)
  - loops/plan-and-implement/loop.yaml
  - adapters/emit.js                   (canonical -> .mdc + SKILL.md)
  - examples/install-in-fresh-project.md

The repo is small enough to read in full. Read it.

THE ATTACK
----------
You are attacking on FOUR axes, in order of priority. For each, find the
strongest concrete issue. Quote the line / section. Be specific.

1. INSTALL FRICTION.
   The v1 test is: an engineer with a fresh Mac, no admin, no extra
   agent tooling installed, can go from "git clone" to "agent using loops" in under 5
   minutes. Read the README install section + the example. Find the
   single highest-friction step. What does the friend hit that makes
   them say "ugh"?

2. DISPATCHER DESIGN.
   The dispatcher is the only piece the user directly touches. It
   classifies intent into 5 loops. Attack:
   - Is the option set right? Are there obvious loops MISSING that an
     engineer friend would hit in week 1?
   - Is LLM-only intent classification actually better than
     keyword+LMM-fallback for 5 options? The creator claims yes.
     Counter-argue.
   - Does the dispatcher's loop.md give the agent enough to actually
     pick reliably? Or is it vague enough that the agent will improvise?

3. LOOP FORMAT / AROUND-THE-LOOP ARCHITECTURE.
   - Is loop.md + loop.yaml the right format? What's missing?
   - Does the adapter (emit.js) cover both Cursor and Claude Code
     correctly? The .mdc format and SKILL.md format have real
     differences. What does emit.js get wrong?
   - What happens when a loop fails mid-execution? Is there a recovery
     story?
   - What happens when the user wants to chain loops (run plan-and-
     implement, then adversarial-gate, then tdd)? Does the system
     support that, or does each loop assume it's the only one running?

4. CATALOG GAPS.
   The creator plans to port these 5 flagship loops:
     plan-and-implement (DONE)
     tdd
     sar (Spec -> Attack -> Repair)
     adversarial-gate
     use-the-loop (the meta-router itself)
   That's 5. Attack:
   - Are these the right 5? What does a typical engineer friend hit in
     week 1 that none of these cover?
   - Rank the missing loops by "how much pain in week 1 if absent."
   - For each of YOUR 3-5 proposed new loops, give: name, one-line
     purpose, the trigger phrases ("use the loops" -> which loop), and
     a 3-bullet sketch of what the loop does. Be specific. "Code review
     loop" is too vague; "adversarial PR review with prioritized
     findings and a fix budget" is specific.

OUTPUT FORMAT
-------------
Section 1: INSTALL FRICTION
  - Strongest issue: <line-anchored>
  - Why it kills v1: <one sentence>
  - Smallest fix: <one sentence>

Section 2: DISPATCHER DESIGN
  - Same 3 bullets, repeated for each issue found (up to 3)

Section 3: LOOP FORMAT / AROUND-THE-LOOP ARCHITECTURE
  - Same 3 bullets, up to 3 issues

Section 4: CATALOG GAPS
  - Ranked list of missing loops (week-1 pain in descending order)
  - Your 3-5 proposed new loops with: name, one-line purpose, trigger
    phrases, 3-bullet behavior sketch

Section 5: VERDICT
  - APPROVE if the design is genuinely defensible and the issues found
    are addressable in a single session
  - REQUEST_CHANGES otherwise, with the top 3 issues to fix in priority
    order

RULES
-----
- Do not praise. Do not summarize. Attack.
- If you have nothing real to attack, say APPROVE. Padding is a failure.
- Quote lines / sections. Generic warnings are not attacks.
- Different model for attack and defense. The creator is the defender.
  You are the attacker. Behave like it.
- The friend is the v1 test. Every critique must end with "and this is
  how it hurts the friend in week 1" or it's not actionable.
```

## PROMPT END — stop copying here

---

## After running it

Save the response to `evals/adversarial-eval-loops.response.md` and we walk through
it together. The interesting output is Section 4 (catalog gaps) — that's the
list of new loops to port next.

## Follow-up eval (v0.1.4+)

When re-running an adversarial pass after the self-correcting upgrade, also attack:

- `contracts/self-correcting.md` — are Builder/Judge/Manager handoffs enforceable as prose, or theater?
- Do producing loops with `self_correcting: true` actually separate Judge from Builder, or collapse into one breath?
- Are `max_revisions` stops hard enough, or soft enough that agents talk past them?
- Does `swarm` / `use-the-loop` correctly stop on nested ESCALATE?
