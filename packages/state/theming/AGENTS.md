# AGENTS — @stackra/theming

The colour scheme a user chooses and the look of a member. Member at `packages/state/theming` (`tier:lib`), in the
programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./browser`, `./react`, `./native`,
`./testing`.

## Where code goes

| You are writing…             | It goes in…                                    |
| ---------------------------- | ---------------------------------------------- |
| The port                     | `src/contracts/ports/`                         |
| The configuration            | `src/config/theming.config.ts`                 |
| Its shape and shipped schema | `src/core/schemas/`, `src/core/constants/`     |
| The service                  | `src/core/services/`                           |
| A platform-free driver       | `src/core/drivers/<name>.driver.ts`            |
| A browser or native driver   | `src/browser/drivers/`, `src/native/drivers/`  |
| React code (web and native)  | `src/react/<name>/`                            |
| A test helper                | `src/testing/functions/`                       |
| A test                       | `__tests__/<name>.<kind>.test.ts(x)` beside it |

## This package

- `ColorScheme` is declared once, in `@stackra/ui/contracts`; never declare a second one here.
- The choice lives in `prefs` under `theming.scheme` and is read on every access, never cached.
- Applying a scheme to the screen is `@stackra/ui`'s provider's job; this package never writes to the DOM or to
  `Appearance`.
- `./contracts` imports no other entry; `src/*/index.ts` are stand-in barrels until gen writes them (STA-339).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

None. The chosen scheme is a device preference kept in client storage and never sent.
