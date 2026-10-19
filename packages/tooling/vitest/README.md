# @stackra/vitest-config

Shared vitest presets. A workspace's `vitest.config.ts` is:

```ts
import { defineConfig, mergeConfig } from "vitest/config";
import { stackraVitest } from "@stackra/vitest-config";
import { withCoverage } from "@stackra/vitest-config/coverage";

export default mergeConfig(
  stackraVitest,
  defineConfig(withCoverage({ test: { include: ["src/**/*.test.ts"] } })),
);
```

| Export                | Use for                                                         |
| --------------------- | --------------------------------------------------------------- |
| `.` / `./preset`      | every Node library                                              |
| `./preset-decorators` | the DI tier (legacy decorators, no metadata emission; ADR-0007) |
| `./preset-react`      | React libraries and the console app (jsdom)                     |

`passWithNoTests` is off on purpose: a package with no tests fails `pnpm test` until it has one.
