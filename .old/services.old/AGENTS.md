# @stackra/backend

One Encore app, one `encore.app`, many services in `src/<service>/`. Tier tag `tier:service`.

## Where code goes

- A service is a directory with `encore.service.ts` (literal `new Service("name")`), `api.ts`, and tests beside the code.
- `db.ts` / `events.ts` / `jobs.ts` / `cache.ts` exist only when the primitive does.

## Rules that fail the build

- Cross-service calls only through `~encore/clients`; no importing another service's internals.
- `auth: true` by default; a public endpoint carries a comment saying why.
- Every tenant-owned table gets `withTenant()`/`withScope()` and RLS `ENABLE` + `FORCE` (see global tenancy rules).
- Secrets via `secret("NAME")`; never a value in a file.
- `tsconfig.json` extends the `encore` preset only.

## Tasks

`pnpm dev`, `test`, `typecheck`, `lint`, `format:check`, `gen:client`, `clean`.

## PII

| Data | Where | Notes                                       |
| ---- | ----- | ------------------------------------------- |
| None | —     | The backend handles no personal data today. |

Revisit when a service stores users, members, contact details or tenant records.
