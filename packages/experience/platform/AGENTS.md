# AGENTS — @stackra/platform

Capabilities of the running target. Member at `packages/experience/platform` (`tier:lib`), in the programming model
v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./browser`, `./desktop`, `./native`, `./node`, `./react`,
`./sw`, `./testing`, `./worker`.

## Where code goes

| You are writing…                     | It goes in…                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| A port or a type its signature names | `src/contracts/ports/`, `src/contracts/types/`                                 |
| A configuration                      | `src/config/<name>.config.ts`, its shape in `src/core/schemas/`                |
| The shipped `X$` of a configuration  | `src/core/constants/<name>-config-schema.constant.ts`                          |
| An enum, a function, a type          | `src/core/{enums,functions,types}/`                                            |
| An isomorphic driver                 | `src/core/drivers/memory-<port>.driver.ts`                                     |
| A target driver                      | `src/{browser,desktop,native,worker}/drivers/`                                 |
| A bridge (Electron main)             | `src/desktop/bridges/<name>.bridge.ts`, extends `Bridge({ key })`              |
| A service-worker handler             | `src/sw/functions/handle-<event>.function.ts`, events typed in `src/sw/types/` |
| React code                           | `src/react/<name>/`                                                            |
| A test helper                        | `src/testing/functions/`                                                       |
| A test                               | `__tests__/<name>.<kind>.test.ts(x)` beside it                                 |

## Entries and barrels

- `src/*/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new public file to its
  barrel and to that entry's `index.test.ts`.
- `TurnstileCaptchaVerifierDriver` is the one symbol on two entries, `./worker` and `./node` (ADR 0127 2026-10-26
  note): its code is portable (`fetch` only), so `src/node/index.ts` re-exports the `src/worker/drivers/` file. A new
  driver goes on one entry; another portable server driver follows the same note.
- `Platform` is exported from `./contracts` only (registry A3). `./contracts` imports no other entry, so `has` takes a
  capability code as a string.
- `./react` stays platform-neutral: the driver supplies what differs (the scanner's `View`).
- No module of `./desktop` imports Electron at load time (the renderer loads the entry for its driver); a bridge loads
  it inside `handle`.

## This package

- A new capability: a `Capability` case, a facet on `Platform` with its type, a row in `CAPABILITY_FACETS`, and an
  implementation in the memory, web (and so desktop) and Expo drivers. A code used only to refuse a peripheral or a
  window call (`print`, `serial`, `card_terminal`, `window`) needs the case only.
- `KioskMode` and `SecondScreen` are ports of their own (not `Platform` facets): main-process mechanisms with Electron
  drivers in `./desktop`, memory drivers in `.`, and a bridge each. Whether a till runs in kiosk mode or shows a
  customer display is a tenant setting; `DesktopConfig.kioskOnLaunch` is only the launch default.
- A window kind (`WindowKind`) means only what `browserWindowOptions` maps it to; a new kind adds a case and its
  options there, never in the shell. `createApp` (`@stackra/app`) is the shell that spreads it.
- A capability call that the target or device cannot honour returns `refuse(capability, code)`; a programming error
  throws.
- A driver's constructor takes only container-built dependencies; gen reads constructor parameters as dependencies.
- A bridge validates its input: it comes from the renderer. No parameter properties and no `#private` fields.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data                   | Where                              | Handling                                                         |
| ---------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| Push tokens            | `PushTransport.register()`         | Per-device addresses; handed to the devices module, never logged |
| Shared payloads        | IndexedDB `share_inbox`            | On the device only; read once by the share page                  |
| Picked folder paths    | the app disk (`platform/folders/`) | On the user's machine only                                       |
| `TURNSTILE_SECRET_KEY` | `SecretStore`                      | Read by name, sent only to Cloudflare, never logged              |
