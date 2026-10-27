# AGENTS — @stackra/loyalty-kit

Points accounts, tiers, earning and redemption as a module: the golden capability kit, ported from the template's
`@acme/loyalty-kit` onto `@stackra/ledger`. Member at `packages/commerce/loyalty-kit` (`tier:lib`), in the programming
model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./node`, `./react`, `./native`, `./testing`.

## Where code goes

| You are writing…                                              | It goes in…                                                       |
| ------------------------------------------------------------- | ----------------------------------------------------------------- |
| A port, an enum or a type hosts code against                  | `src/contracts/{ports,enums,types}/`                              |
| The configuration and its shape                               | `src/config/`, `src/core/schemas/`                                |
| Isomorphic logic, a refusal, a shared view, the memory driver | `src/core/{services,errors,schemas,drivers,functions,constants}/` |
| A kind of the module (action, query, event, listener, …)      | its group under `src/node/`                                       |
| A permission set or a policy                                  | `src/node/access/`                                                |
| A workflow or a signal                                        | `src/node/workflows/`                                             |
| A panel resource, document or widget                          | `src/node/resources/loyalty-account/`                             |
| A model, its migration, a factory, the demo seeder            | `src/node/models/`, `src/node/database/*/`                        |
| A renderer and its Props                                      | `src/react/<name>/`, `src/native/<name>/`                         |
| A fake, fixture or matcher                                    | `src/testing/`                                                    |
| A label                                                       | `assets/lang/{en,ar}/loyalty_kit.json` (`en-US` overlay)          |
| A test                                                        | `__tests__/<name>.<kind>.test.ts(x)` beside it                    |

## Entries and barrels

- `src/{contracts,core,node,react,native,testing}/index.ts` are stand-in barrels until gen writes the entry barrels
  (STA-339); add every new public file to its barrel and to that entry's `index.test.ts`.
- `contracts` is the leaf; `core` imports `contracts`; `node`, `react` and `native` import `core`; `testing` imports
  them all. The factories and the seeder live in `src/node/database/` and are exported from `./testing` only, so Faker
  never reaches a runtime entry. `./react` and `./native` never import each other or `./node`.

## This package

- Points live behind `LoyaltyLedger`. A debit that must never overdraw goes through `debit`; every driver keeps the
  check and the write one step per member. `expire` is cut at zero in every driver; never add an expiry or debit path
  that skips the floor. In the Postgres driver every journal call states its floor (`null` for `append`, `0` for
  `debit` and `expire`).
- A programme is the settings group at a scope (ADR 0454): both earn paths read `isActive` and the spend rate is the
  `earnPerMinor` setting; never read the earn rate from config on the server.
- Tier rules live behind `LoyaltyTierPolicy` (the `threshold` driver by default); the listener only applies the answer
  and only raises a tier. Never put a tier rule in the listener.
- Every balance move records an integration event (`points.earned`, `points.redeemed`, `points.expired`); a new move
  gets one too, named `<model>.<verb>` so gen writes `loyalty_kit.<model>.<verb>.v<n>`.
- `AccountService.earn` is the one spend-based earn path (enroll, `earnAdjust`, append, `points.earned`) and
  `AccountService.earnVisit` the one visit-based (stamp card) path; never credit points another way.
- Stamp counts and card sizes are settings; which visits earn is the host's rule set. Never fix either in code.
- The tables are owned through tenancy's `BelongsToTenant` and `t.belongsToTenant()` (ADR 0323 d1 allows the use);
  declare no `tenant` identifier here (R-59). Migrations are frozen snapshots: literals only, every column
  `.notNull()` or `.nullable()` with a `.comment()` equal to the model field's docblock.
- Every `Schema`, event and settings class registers its zod schema in its own file until gen writes `#stackra/schemas`.
- No parameter properties and no `#private` fields: services typecheck this source under `erasableSyntaxOnly`.
- Every action and query names its permission (`LoyaltyAccountPermissions.<verb>`); never leave one to the derived
  name, because the kit's keys name `account` and `points`, not the model. Record rules go in `LoyaltyAccountPolicy`.
- A redemption that must be undoable goes through `RedeemPointsWorkflow`; its undo credits under
  `REVERT_REFERENCE_PREFIX`. The engine answers `ctx.run` when the run parks, so never promise a caller the outcome of
  the wait.
- Panel declarations take icons, slots and i18n keys from the internal stand-ins (`LOYALTY_KIT_ICONS`,
  `LOYALTY_KIT_SLOTS`, `LOYALTY_KIT_KEYS`), never a raw string (R-56); delete the stand-ins with STA-339.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).
- Annotate every export whose inferred type would reach an unexported or deep-path type (`ExtensionBase`, `ActionBase`,
  `PassBase`, a provider's `bin/` class, `@types/react`'s `Element`): the declaration build fails with TS2883 (STA-1220).

## PII

| Data      | Where                                                    | Handling                                                                                                           |
| --------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Member id | `loyalty_accounts.member_id`, `ledger_entries.member_id` | The host principal's public id, never a name or address; `LoyaltyAccount.memberId` is `@Classified(Pseudonymous)`. |
| Notes     | `loyalty_accounts.notes`                                 | Staff notes (who flagged, why); free text bounded at 500 characters, never personal data by rule.                  |
