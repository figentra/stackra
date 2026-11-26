# AGENTS — @stackra/vitest-config

- Owner: release-operations.
- Do not add test options in a consuming workspace beyond `include`/`setupFiles`; change the preset and ship a changeset.
- Coverage thresholds live in `src/constants/coverage-thresholds.constant.ts` and
  `src/constants/strict-coverage-thresholds.constant.ts` (exported from `./coverage`); a threshold only moves upward.
- `STRICT_COVERAGE_PACKAGES` (`src/constants/strict-coverage-packages.constant.ts`) names the packages held to
  90/90/80 (ADR 0182 decision 2). A new `packages/security/*` package joins it in the same change (a test fails
  otherwise); a package never leaves it.
- Secrets: forbidden.

## PII

| Data | Where | Handling                                                    |
| ---- | ----- | ----------------------------------------------------------- |
| none | —     | Test presets; they configure the runner and handle no data. |
