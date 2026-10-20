# AGENTS — @stackra/vitest-config

- Owner: release-operations.
- Do not add test options in a consuming workspace beyond `include`/`setupFiles`; change the preset and ship a changeset.
- Coverage thresholds live in `src/coverage.ts` here; a threshold only moves upward.
- Secrets: forbidden.

## PII

| Data | Where | Handling                                                    |
| ---- | ----- | ----------------------------------------------------------- |
| none | —     | Test presets; they configure the runner and handle no data. |
