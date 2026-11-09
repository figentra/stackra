---
"@stackra/actions": minor
---

The audit step now records each call by an API key (a credential, an `api_client` actor or an `api_key` origin), queries included, as one entry. A user's query is still not audited.

`AuditEntry` gains three fields:

- `idempotencyKey`: the key the call ran under;
- `apiVersion`: from the new `CallOptions.apiVersion`, which the generated adapter sets;
- `durationMs`.

The `outbox` trail's `actions.audit_entry.recorded.v1` event carries all three as optional fields of version 1. An entry never carries an input or output body, or an API key's secret.
