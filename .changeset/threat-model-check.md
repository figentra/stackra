---
"@stackra/repo-checks": minor
---

`stackra validate` checks threat models (constitution SEC10, STA-316). A member's `docs/threat-model.md` must open with
an `ASVS level: L1|L2|L3` line and a `Reviewed: YYYY-MM-DD` line, then hold `## Assets` (asset, where it lives, class),
`## Trust boundaries` (a numbered list) and `## Threats and controls` (threat, control today, open work), in that order;
a class is `internal`, `confidential`, `pii` or `secret`, and a threat whose control today is "None" must name the
issue that tracks it. The shape is checked wherever such a file exists (rule `threat-model`). In the Stackra repository,
every member under `packages/security/` and those in the new `THREAT_MODEL` constant must keep one, and the platform
page `apps/docs/src/docs/customers/threat-model.mdx` must link each of them (rule `threat-model-index`). New exports:
`THREAT_MODEL`, `checkThreatModel`, `checkThreatModelIndex` and `needsThreatModel`.
