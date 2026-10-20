# AGENTS — @stackra/typescript-config

- Owner: release-operations (the owner for version bumps).
- Do not add compiler options in a consuming workspace; change the preset and ship a changeset.
- A compiler-option change is a toolchain change and needs an ADR.
- Secrets: forbidden.

## PII

| Data | Where | Handling                                      |
| ---- | ----- | --------------------------------------------- |
| none | —     | Compiler presets (JSON); they handle no data. |
