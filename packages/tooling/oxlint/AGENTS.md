# AGENTS — @stackra/oxlint-config

- Owner: release-operations (architecture-guardian owns `boundaries.jsonc`).
- Do not add rules in a consuming workspace; change the preset and ship a changeset.
- A new boundary pattern is an architecture change: it needs an ADR and a constitution update.
- Secrets: forbidden.

## PII

| Data | Where | Handling                                                                     |
| ---- | ----- | ---------------------------------------------------------------------------- |
| none | —     | Lint presets (JSON); they read source files at lint time and retain nothing. |
