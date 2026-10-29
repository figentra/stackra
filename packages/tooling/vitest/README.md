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
| `./coverage`          | `withCoverage`, the shared coverage gate                        |
| `./int`               | `intTier`, the integration tier (`test:int`) of a member        |

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
