# health service

## Rules

- `encore.service.ts` is a literal `new Service("health")`.
- One `api()` per operation, typed request and response.
- `auth: true` by default; a public endpoint carries a comment saying why.
- Cross-service calls only via `~encore/clients`.
- `db.ts` / `events.ts` only when the primitive exists.
- Its one endpoint is public on purpose.

## PII

| Data | Where | Notes                     |
| ---- | ----- | ------------------------- |
| None | —     | Handles no personal data. |
