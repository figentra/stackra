---
"@stackra/runway": minor
---

`runway evidence <environment> --target <t> --sha <sha> [--member <m>]` writes the approvals bot's evidence for
one deploy job (ADR 0533): `runway-evidence-<environment>[-<member>].json` with the repo, commit, target and member,
`rollout` (true only for a gradual `release.strategy.kind` with `autoRollback`) and `destructive` (null, the owner's,
until gen classifies migrations). The contract `runway.evidence/v1` is agreed with figentra/infra's classifier.
