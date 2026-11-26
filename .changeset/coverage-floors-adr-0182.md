---
"@stackra/vitest-config": minor
---

`withCoverage` now gives each member its ADR 0182 coverage floor: 80% lines and functions and 70% branches for every
member, and 90/90/80 for the packages in the new `STRICT_COVERAGE_PACKAGES` (every `packages/security` package, plus
actions, outbox, workflow, versioning and validation). It reads the member's name from the `package.json` in the
config's `root`, or in the working directory a `test:coverage` script runs in. The `./coverage` entry also exports
`STRICT_COVERAGE_THRESHOLDS` and `coverageThresholdsFor(name)`. A member's documented override still wins.

`CoverageOverrides.thresholds` now takes any number: it was typed as the frozen floor's literal values, so a member
could not write the lowered threshold the change policy allows.
