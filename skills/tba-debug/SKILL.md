---
name: tba-debug
description: Find the root cause of a bug before anyone designs a fix. Five gates in order - a runnable repro, the fail path read from real state, ranked hypotheses each with a disproof, a ledger of every run, and a root cause that is the first wrong decision in the code. For TBA BugsJaeger. Writes the diagnosis, never the fix.
---

# TBA debug

Goal: one confirmed root cause, written down so that TBA PlanMan can design the fix without redoing your work. You diagnose. You do not fix, commit, push or write to Jira.

The five gates run in order. Do not pass a gate on a guess.

## Gate 1: a repro that runs

Build something that fails on command: a failing test, a curl script, a CLI call, a replay.
- Reliable: save the exact steps, inputs and environment as that runnable artifact.
- Flaky: raise the failure rate first (loop it, add load, shrink the timing window). A 1-in-100 failure cannot be debugged.
- Impossible to reproduce: stop here. Say so, and ask the user for logs, data, access or permission to add probes. Do not move on to hypotheses.

Aim for a pass/fail signal in a few seconds. Pin time, seed random numbers, cut the network.

## Gate 2: read the fail path from real state

Find where the code first does the wrong thing, and what would have stopped it. Escalate only when the step before gives nothing.
1. Debugger or a single breakpoint at the failing line. Read the actual values.
2. Trace the code from the entry point to the failure and list every switch that changes the result: config, env var, feature flag, input shape, timing, order of calls. Flip one at a time.
3. Probes in the code. Tag every probe with `[DBG-<4 hex>]` so one grep removes them all. Probes never stay in the final diff.

## Gate 3: hypotheses that can lose

Write 3 to 5 hypotheses, ranked. For each one write the cheapest test that would **disprove** it, and run that test first. A hypothesis that survived its disproof is worth keeping; a single favourite idea is how you chase the wrong bug for an hour.

## Gate 4: the ledger

Keep a table of every run in this session: what you changed, what happened, what it ruled in or out. Before you believe a hypothesis, check it against **every** row, not only the last one. If one row contradicts it, refine or drop it. When two hypotheses are still alive, design the one run that separates them.

## Gate 5: root cause, not the place where it showed up

The root cause is the first place the system made a wrong decision or failed to handle a state it should handle.
- Ask: is the state that triggered the symptom legitimate? If yes, the code that did not handle it is the cause. If no, a check at the symptom only hides it: find what produced the state.
- Guards, retries, swallowed errors and clamped values are the usual ways to hide a bug. Name them if you see one.
- Search for the same pattern elsewhere (callers, siblings, copies). Report every place.
- If the deciding fact took a deep dig, say what cheap always-on signal (log line, assert, metric) would have shown it at first look.

## What you write

`.tba/cases/<KEY>/debug.md`, in Thai with English technical terms:
1. Repro (the artifact and how to run it)
2. Fail path (entry point to failure, with `file:line`)
3. Hypotheses, each marked survived / disproved, with the test used
4. Ledger
5. Root cause and the evidence that confirms it
6. Other places with the same pattern
7. What a fix must satisfy, and what it must not change
8. Regression test idea: it must fail before the fix and pass after
9. `TODO (ยังไม่ confirm)` for anything you could not prove

## Rules

- Never propose a fix before Gate 1 passes. If you catch yourself doing it, go back.
- Never call a hypothesis "the cause" without a run that confirms it against the ledger.
- Never print the value of a secret that you meet in logs, env or config: cite `file:line` and the kind, mask the value.
- Remove every `[DBG-...]` probe before you hand over. Say so in the handoff.
- No root cause that survives: stop and ask the user. Do not hand over a guess.

## Credit

The root-cause and prove-it-by-running ideas follow the principles `fix-root-causes` and `prove-it-works` of pstack (MIT, see `references/pstack-LICENSE.txt`). The text of this skill is original to this bundle.
