# gen golden snapshots

<!--
Stackra file contract:
Purpose: what the golden fixtures are, their layout, and the one command that refreshes the expected output.
Boundary: packages/developer/gen/__golden__ only: fixture data and expected output, never code; the runner is
          src/node/__tests__/golden.test.ts. Every fixture file (inputs and expected output) is covered by this
          contract, since a `.golden` file carries no comment of its own.
Runtime: none (data read by the vitest runner)
Governing contract: STA-1320 (freeze gen's interface); ADR 0294 (decisions 10 and 22); ADR 0295 (decision 5).
-->

These fixtures freeze what `stackra gen` writes and refuses. `src/node/__tests__/golden.test.ts` copies each
fixture's `input/` to `.cache/golden/<fixture>/`, runs `generate` over its members in order, and compares every file
the runs wrote or changed with `expected/`, and the refusals with `refusals.json`. A clean member is also run again
with `check: true` and must report nothing stale. A change to the generated file set, a path, a file's content or a
refusal code shows up as a diff here and needs a deliberate refresh.

## Layout

| Path                                 | Holds                                                                                          |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `<fixture>/input/**.golden`          | the fixture workspace: `pnpm-workspace.yaml`, `runway.yaml` and each member's files            |
| `<fixture>/input/_modules/**.golden` | written as `node_modules/` (stand-in kind bases and packages; git never tracks `node_modules`) |
| `<fixture>/expected/**.golden`       | every file gen wrote or changed, at its path in the workspace                                  |
| `<fixture>/refusals.json.golden`     | the refusals: member, code, file and subject (never the wording); `[]` when clean              |

Every file ends in `.golden` so tsc, oxlint, oxfmt, knip and the validator never read fixture code or generated output
as repository code; the runner strips the suffix. Absolute paths are written as `<workspace>`. The nested
`.gitignore` keeps a docs app's `.stackra/site/` tracked here.

A refusal fixture names a `base` in the runner's `FIXTURES` table and overlays a few files on that base's input.

## Fixtures

| Fixture                  | Members (run order)                       | Covers                                                                                                               |
| ------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `service`                | `services/shop`                           | a service: config, port and driver, enum, schemas, permissions, action, refusal, event, listener, models, Encore app |
| `package-drivers`        | `packages/shop`                           | a package with a port, two drivers and the config that selects one                                                   |
| `app-clients`            | `services/channels`, `apps/web`           | an app injecting a service's generated client                                                                        |
| `docs`                   | `apps/handbook`                           | a docs app: the `.stackra/site/` Mintlify root                                                                       |
| `consumer`               | `services/catalogue`, `services/channels` | a service consuming another service's manifest (client and integration event)                                        |
| `i18n-packages`          | `packages/customers`                      | own lang plus a declared package's lang namespace (`#stackra/i18n`)                                                  |
| `refusal-reader`         | `packages/shop`                           | shape, file and class refusals of the source reader                                                                  |
| `refusal-shim-authored`  | `packages/shop`                           | `shim_authored` (root `vitest.config.ts`, `tsdown.config.ts`)                                                        |
| `refusal-tool-reason`    | `packages/shop`                           | `tool_reason_missing`                                                                                                |
| `refusal-encore-stray`   | `services/shop`                           | `encore_app_stray`                                                                                                   |
| `refusal-encore-missing` | `services/shop`                           | `encore_app_missing`                                                                                                 |
| `refusal-docs-misplaced` | `apps/handbook`                           | `docs_source_misplaced`                                                                                              |
| `refusal-docs-config`    | `apps/handbook`                           | `docs_config_invalid`                                                                                                |
| `refusal-client-unknown` | `services/channels`                       | `client_service_unknown` (the producer has no manifest yet)                                                          |

## Refresh the expected output

On ci-box only (nothing runs on the Mac), from the repository root:

```sh
UPDATE_GOLDEN=1 pnpm --filter @stackra/gen exec vitest run src/node/__tests__/golden.test.ts
```

Then review the diff of `__golden__/` like code and commit it. Without `UPDATE_GOLDEN=1` the same command compares, and
it is part of gen's `test` task, so every gate run checks it. A fixture with no `refusals.json.golden` fails with this
command in its message.
