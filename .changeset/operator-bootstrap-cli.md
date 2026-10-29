---
"@stackra/cli": minor
---

Add `stackra ops bootstrap-operator --email <email> [--role] [--env] [--api] [--dry-run]` (STA-1586): calls the
environment's own `identity.operator.bootstrap@1` on the API origin from the root `runway.yaml` (or `--api`) with the
bootstrap token in `STACKRA_OPS_TOKEN`, prints granted, already holds or would grant, and exits 1 when no user has the
email. No database shell or connection.
