# AGENTS — @stackra/commitlint-config

- Owner: release-operations.
- A consuming repo sets only `extends` and its `rules` in `.commitlintrc.yaml`; change the preset and ship a changeset.
- `refs-issue-key` is off in the preset. A repo turns it on with its tracker prefix as the value.
- Secrets: forbidden.

## PII

| Data | Where | Handling                                                                   |
| ---- | ----- | -------------------------------------------------------------------------- |
| none | —     | Lint preset; it reads a commit message at commit time and retains nothing. |
