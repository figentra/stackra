---
"@stackra/repo-checks": minor
---

Spec tiers (ADR 0502): `specTierOf`, `specComputedTier`, `specCheckTier`, `specApprovedAt` and `specCheckApproval`; `specFindings` checks the diff's tier floor against the branch's own spec, and `specCheckStage` takes a small spec's plan and tasks from spec.md and requires the approval stops of feature and big specs. Kiro depth: `specCheckCriteria` (EARS acceptance criteria with `AC-###` ids), `specCheckDesign` (plan.md's nine design sections, or a small spec's short `## Design`), `specCheckTraceTasks` (each task covers an AC and names a file, each AC is covered), AC ids in `covers:` and in the trace's `@covers` check at Done.
