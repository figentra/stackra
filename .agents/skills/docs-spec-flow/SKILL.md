---
name: docs-spec-flow
description: Take a piece of work from request to merged change in Stackra - choose the lane (bug, chore, lite, full) and change risk R0 to R3, write the spec with its Impact questionnaire in .agents/specs/sta-<n>-<slug>/, run the spec-kit commands in order through the clarify gate, keep Linear in state with pnpm linear, trace FRs to tests with @covers, and merge through pr:merge. Use at the start of any feature, bug or chore, and when a spec gate fails.
---

# The spec flow

Full reference: `apps/docs/src/agents/spec-lifecycle.mdx`. Decisions: ADR 0065 (Linear gate), 0067 (spec-kit), 0119
(merge policy), 0230 (reviewer identity), 0120 (location, lanes, change risk), 0121 (tooling), 0198 (states, traceability).

## 1. Lane and change risk (ADR 0120)

First match wins; a change may move to a heavier lane any time, to a lighter one only with a recorded reason.

| Lane  | When                                                                                     | Path                                             | Commit types       |
| ----- | ---------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------ |
| bug   | A defect in existing behaviour, one member, no contract change                           | `.specify/bugs/sta-<n>-<slug>/`, failing test first | `fix`            |
| chore | No behaviour change: docs, dependencies, tooling, refactor, tests, CI without permissions | No spec                                          | `chore`, `docs`, `test`, `ci` |
| lite  | New behaviour, R0–R1, one member, additive, ≤ ~400 lines, no ADR                         | Specify → implement in one PR                    | `feat`             |
| full  | Everything else                                                                          | A design PR, then one PR per user-story phase    | `feat`             |

Change risk: **R0** docs/tests, **R1** one member internal, **R2** a public contract, a new package or member, several
members, a new dependency, a UI surface, **R3** auth, IAM, tenancy or RLS, tenant-data migrations, money, PII, secrets,
webhooks or outbound HTTP, crypto, CI permissions, agent guards. Raise it, never lower it.

A `feat` commit needs a spec reached through the branch key or its `Refs:` key; `spec-gate ci` fails otherwise.

## 2. Linear first

```bash
pnpm linear create --title "Refund an invoice" --labels agent   # if no issue exists
git switch -c figentra/sta-<n>-<slug> origin/main                # Linear's branch name
pnpm linear start STA-<n>
```

## 3. Spec-kit, in order

```text
/speckit.specify → /speckit.clarify → /speckit.plan → /speckit.tasks → /speckit.analyze → /speckit.implement
```

- `spec.md` carries `**Linear**: STA-n`, `**Clarifications status**`, `**Status**` and an `## Impact` questionnaire with
  every line answered (`none` is an answer): members touched, cross-service events, tenancy and data, secrets (names
  only), ADR needed, new dependencies, deploy modes (SaaS, on-prem, air-gapped), lane, change risk.
- `/speckit.plan` refuses until clarify is `complete`, a real key is set, Impact is answered and no
  `[NEEDS CLARIFICATION` marker remains.
- A question the ADRs and the decision register do not answer is an **open question for the owner**. Never invent a
  decision; a decision that changes a rule needs an ADR (`docs-adr-steward`).
- Tasks: unique ids, `covers:` FR ids, a `route:` from `.agents/routing.yaml`, acyclic `deps:`; then
  `pnpm spec:linear tasks <tasks.md>` creates the sub-issues.
- States move Draft → Clarified → Planned → Tasked → Implementing → Done; append a `## Status history` line each time.

## 4. Build and trace

- Tests tag what they prove: `// @covers sta-<n>:FR-003`. Done requires every FR covered by a test.
- `node tools/scripts/spec-gate.mjs ci` and `node tools/scripts/spec-trace.mjs ci` run inside `pnpm validate`.

## 5. Commit, PR, review, merge

- Conventional commits; `feat`, `fix`, `refactor`, `perf` carry `Refs: STA-n`. Never `--no-verify`.
- `pnpm verify` green, then open the PR (title or branch names the key) and run `pnpm linear review STA-n <pr-url>`.
- Builders commit, push and open PRs as the bot: `pnpm bot:git -- commit …`, `pnpm bot:git -- push origin HEAD`,
  `pnpm bot:gh -- pr create …` (ADR 0230), never as the owner's account.
- An **independent** reviewer (`code-reviewer`, never the session that wrote it) posts a new comment through
  `pnpm bot:review` whose first line is `AI-REVIEW: PASS <full head sha> base=<base ref> patch=<patch id>`. A `design` or `risk:R3` PR
  also needs the owner's APPROVED review ending in `owner-approval`; an agent never writes that token.
- The lead merges with `pnpm pr:merge <n>` only (it enqueues where a merge queue exists); never `--admin`, never a push to `main`. Then
  `pnpm linear done STA-n <link>`.

## Check

`pnpm spec:gate ci`, `pnpm spec:trace ci`, `pnpm verify`.
