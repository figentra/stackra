# AGENTS — @stackra/achievements

Award kinds as scope data, awards granted by hand or by `@stackra/rules` criteria, revoke, a cross-scope verify token
with a QR code and certificate fields for `@stackra/documents` (ADR 0368, OS ADR 0058). Member at
`packages/application/achievements` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries
`./contracts`, `.`, `./node`.

## Where code goes

| You are writing…                                       | It goes in…                                         |
| ------------------------------------------------------ | --------------------------------------------------- |
| A type or enum a consumer stores or reads              | `src/contracts/{types,enums}/`                      |
| An integration event, a refusal, an isomorphic helper  | `src/core/{events,errors,functions,constants}/`     |
| A model, a migration                                   | `src/node/models/`, `src/node/database/migrations/` |
| A service, the recipient registry and its registration | `src/node/{services,constants,functions}/`          |
| A test                                                 | `__tests__/<name>.test.ts` beside it                |

## Entries and barrels

- `src/{contracts,core,node}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new
  public file to its barrel and to that entry's `index.test.ts`.
- `src/contracts/` is the leaf; `core` imports it, `node` imports `core`. Nothing in `.` touches a database.
- The event schemas (`*-schema.constant.ts`) mirror their classes by hand until gen compiles them; change both together.

## This package

- Configuration, not code (ADR 0363): never add an award kind, a level, a period format, a URL or a certificate layout
  as a literal. Kinds are `AwardKind` rows; layouts are print templates named by key.
- Evaluate criteria only through `evaluate` of @stackra/rules (ADR 0331 decision 1); the consumer computes the facts.
- `achievements.award_verifications` is the one table without row-level security (ADR 0368 decision 5). It holds a
  token hash, an award id and a scope, nothing else: never add personal data or the token to it.
- Every award write goes through `AwardService`, which records `AwardGranted`/`AwardRevoked` on the row and keeps the
  verification row in step (written on grant, deleted on revoke) in one flush.
- `verify` opens a scope session (`Database.withScope`); never call it from a method another action's transaction runs.
- No tenant word is declared here (R-59, ADR 0323): a scope is a `ScopeRef`. No parameter properties and no `#private`
  fields (services typecheck this source under `erasableSyntaxOnly`). Never import `@mikro-orm/*` (ADR 0097 d2).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data                   | Where                                          | Handling                                                                    |
| ---------------------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| Recipient              | `achievements.awards.recipient_id`, events     | A public id and model key only; never a name                                |
| Grant and revoke words | `achievements.awards.reason`, `revoked_reason` | Written by a person of the scope; may hold personal data; never in an event |
| Verify token           | `achievements.awards.verify_token`             | A bearer link to a public verify page; the unscoped index keeps its hash    |
| Facts                  | process memory during `consider`               | Computed by the consumer, evaluated and dropped; never stored here          |
