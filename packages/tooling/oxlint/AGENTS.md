# AGENTS — @stackra/oxlint-config

- Owner: release-operations (the owner owns `boundaries.jsonc`).
- Do not add rules in a consuming workspace; change the preset and ship a changeset.
- A new boundary pattern is an architecture change: it needs an ADR and a constitution update.
- `base.jsonc` turns on every `stackra/*` rule at `error`; keep the list equal to `STACKRA_PLUGIN.rules`
  (`presets.test.ts` checks it). JS plugins load from their source file (ADR 0421).
- `no-restricted-imports` does not merge across overrides: every override in `boundaries.jsonc` repeats the
  deep-src and retired-import patterns, and each new pattern needs a banned line in `src/__tests__/fixtures/`.
- Secrets: forbidden.

## PII

| Data | Where | Handling                                                                     |
| ---- | ----- | ---------------------------------------------------------------------------- |
| none | —     | Lint presets (JSON); they read source files at lint time and retain nothing. |
