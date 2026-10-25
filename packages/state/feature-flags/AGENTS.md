# AGENTS — @stackra/feature-flags

The `Flag` kind, the flag reader and its providers. Member at `packages/state/feature-flags` (`tier:lib`), in the
programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./lint`, `./react`, `./testing`.

## Where code goes

| You are writing…       | It goes in…                                    |
| ---------------------- | ---------------------------------------------- |
| The kind base (`Flag`) | `src/core/bases/flag.base.ts`                  |
| The port or its types  | `src/contracts/{ports,types}/`                 |
| The configuration      | `src/config/feature-flags.config.ts`           |
| A provider driver      | `src/core/drivers/<name>.driver.ts`            |
| The reader             | `src/core/services/`                           |
| React code             | `src/react/<name>/`                            |
| A test helper          | `src/testing/functions/`                       |
| A lint rule            | `src/lint/constants/<name>-rule.constant.ts`   |
| A test                 | `__tests__/<name>.<kind>.test.ts(x)` beside it |

## This package

- A flag is a release switch or experiment arm, never a commercial right (entitlements, ADR 0213 decision 7); the
  `feature-flags/no-plan-targeting` rule of `./lint` refuses a flag named or optioned after a plan, tier or edition.
- Keys and label keys are derived from the class name and module; never add a `key` option.
- A `null` subject is anonymous: PostHog is not asked and every flag stays at its default.
- `./contracts` imports no other entry; `src/*/index.ts` are stand-in barrels until gen writes them (STA-339).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

| Data                     | Where                       | Handling                                                                           |
| ------------------------ | --------------------------- | ---------------------------------------------------------------------------------- |
| Visitor, user, tenant id | `FlagContext`, PostHog call | Sent only when present (consent given); only the id `targeting` names. Not stored. |
