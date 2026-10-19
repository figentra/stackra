# @stackra/backend

The one Encore.ts application. Each service lives in `src/<service>/`.

## Tasks

| Script                              | Does                                                       |
| ----------------------------------- | ---------------------------------------------------------- |
| `pnpm dev`                          | `encore run` (`pnpm backend` from the root)                |
| `pnpm test`                         | `scripts/test.mjs` runs `encore test`                      |
| `pnpm typecheck`                    | `tsc --noEmit`                                             |
| `pnpm lint`                         | `oxlint .`                                                 |
| `pnpm format` / `pnpm format:check` | `oxfmt` write / check                                      |
| `pnpm gen:client`                   | Generate the TypeScript client into `encore.gen/client.ts` |
| `pnpm clean`                        | Remove `encore.gen`, `.encore`, `.turbo`                   |

## Structure

```
encore.app        app config and gateway
src/health/       liveness endpoint
src/example/      sample service calling health through ~encore/clients
scripts/test.mjs  test runner wrapper
```

## Run

`pnpm install`, then `pnpm backend`; test with `pnpm --filter @stackra/backend test` (needs the `encore` CLI).
