# @stackra/vitest-config

Shared vitest presets. A workspace's `vitest.config.ts` is:

```ts
import { defineConfig, mergeConfig } from "vitest/config";
import { stackraVitest } from "@stackra/vitest-config";
import { withCoverage } from "@stackra/vitest-config/coverage";

export default mergeConfig(
  stackraVitest,
  defineConfig(withCoverage({ test: { include: ["src/**/__tests__/**/*.test.ts"] } })),
);
```

| Export                | Use for                                                         |
| --------------------- | --------------------------------------------------------------- |
| `.` / `./preset`      | every Node library                                              |
| `./preset-decorators` | the DI tier (legacy decorators, no metadata emission; ADR-0005) |
| `./preset-react`      | React libraries and the console app (jsdom)                     |
| `./coverage`          | `withCoverage`, the shared coverage gate at each member's floor |
| `./int`               | `intTier`, the integration tier (`test:int`) of a member        |

`withCoverage` reads the member's name from the `package.json` in the config's `root` (else the working directory a
`test:coverage` script runs in) and applies its floor (ADR 0182 decision 2): lines and functions 80, branches 70
(`COVERAGE_THRESHOLDS`), or 90/90/80 (`STRICT_COVERAGE_THRESHOLDS`) for the packages in `STRICT_COVERAGE_PACKAGES`:
every `packages/security` package, plus actions, outbox, workflow, versioning and validation. `coverageThresholdsFor(name)`
answers the floor of one package. A member that cannot meet its floor lowers one threshold in its own
`vitest.config.ts` with the reason (`withCoverage(config, { thresholds: { branches: 75 } })`). `pnpm test:coverage`
runs the gate over packages and services; `pnpm verify:box` and `stackra check --with-tests` run it.

The base preset sets `pool: "forks"`, `maxWorkers` at half the CPUs (`STACKRA_TEST_MAX_WORKERS` overrides it),
`testTimeout` 30 s and `hookTimeout` 60 s, because service tests boot a PGlite (3 to 4 s of CPU each). `intTier` keeps
`fileParallelism: false`.

The `.` entry adds the role presets, one per member role (they are what `stackra gen` writes into each member's
`.stackra/vitest.config.ts`):

| Role            | Use for                                   | What it sets                                                                             |
| --------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| `libraryPreset` | packages                                  | `servicePreset` under the coverage gate, plus jsdom `react` and `native` projects        |
| `servicePreset` | services                                  | legacy decorators; a `unit` project (`*.test.ts`) and an `int` project (`*.int.test.ts`) |
| `appPreset`     | web and desktop apps                      | jsdom and legacy decorators; a node project per `nodeFolders` entry; `exclude` for e2e   |
| `mobilePreset`  | the mobile app                            | jsdom and legacy decorators over every `*.test.ts` and `*.test.tsx`                      |
| `toolingPreset` | the preset packages in `packages/tooling` | plain Node, explicit `vitest` imports, no decorators, no coverage gate                   |

A member with `.int.test.ts` files (Testcontainers Postgres through `usePostgres()`, so Docker) adds
`vitest.int.config.ts` and the script `"test:int": "vitest run --config vitest.int.config.ts"`:

```ts
import { intTier } from "@stackra/vitest-config/int";

import config from "./vitest.config";

export default intTier(config);
```

`intTier` keeps the member's preset, aliases and generated setup and replaces `include` with `INT_TESTS`:
`src/**/__tests__/**/*.int.test.{ts,tsx}` and gen's `.stackra/tests/**/*.int.test.ts` (the tenant-isolation test).
Files run one after another, one container each. CI runs the tier in the Quality Gate (`pnpm test:int`).

`passWithNoTests` is off on purpose: a package with no tests fails `pnpm test` until it has one.
