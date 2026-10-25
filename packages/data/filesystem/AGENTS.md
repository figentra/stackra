# AGENTS — @stackra/filesystem

Server disks behind the `FileSystem` port. Member at `packages/data/filesystem` (`tier:lib`), in the programming model
v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./node`, `./desktop`.

## Where code goes

| You are writing…                         | It goes in…                                      |
| ---------------------------------------- | ------------------------------------------------ |
| The port or a port type                  | `src/contracts/{ports,types}/`                   |
| The configuration                        | `src/config/filesystem.config.ts`                |
| A bundle-safe driver (no `node:*`)       | `src/core/drivers/<name>.driver.ts`              |
| A driver that needs Node or the AWS SDK  | `src/node/drivers/<name>.driver.ts`              |
| The Electron driver                      | `src/desktop/drivers/`                           |
| A function, a constant, a schema, errors | `src/core/{functions,constants,schemas,errors}/` |
| A test                                   | `__tests__/<name>.<kind>.test.ts` beside it      |

## Entries and barrels

- `src/{core,contracts,node,desktop}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to its barrel.
- `./contracts` imports no other entry; `.` stays bundle-safe; only `./node` imports `node:*` or `@aws-sdk/*`, only
  `./desktop` imports `electron`.

## This package

- Every driver normalises keys through the one shared function: `..`, a backslash or a NUL is a `RangeError`.
- No credential is configuration: the S3 driver uses the SDK's default chain; the Encore driver imports no
  `encore.dev` and drives the `EncoreBucket` slice the generated app binds.
- One disk per member; named disks, uploads and tenant file records belong elsewhere (README, "Not here").

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

| Data          | Where           | Handling                                                                          |
| ------------- | --------------- | --------------------------------------------------------------------------------- |
| File contents | the chosen disk | Whatever the caller writes; this package never logs or inspects contents or keys. |
