import { stackraVitestReact } from "@stackra/vitest-config/preset-react";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  stackraVitestReact,
  defineConfig({ test: { include: ["src/**/__tests__/**/*.test.{ts,tsx}"] } }),
);
