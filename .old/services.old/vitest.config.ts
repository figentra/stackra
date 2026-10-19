import path from "node:path";

import { stackraVitest } from "@stackra/vitest-config";
import { defineConfig, mergeConfig } from "vitest/config";

// `encore test` provisions infrastructure, then runs this config (scripts/test.mjs).
export default mergeConfig(
  stackraVitest,
  defineConfig({
    resolve: { alias: { "~encore": path.resolve(import.meta.dirname, "./encore.gen") } },
    test: {
      include: ["src/**/*.test.ts"],
      fileParallelism: false,
      testTimeout: 30_000,
      hookTimeout: 60_000,
    },
  }),
);
