/**
 * Stackra file contract:
 * Purpose: `libraryPreset`, the vitest config of a package: the service layout under the shared coverage gate, plus a
 *          jsdom project for its `react` and `native` folders.
 * Boundary: test layout only: projects, environments, the coverage gate.
 * Runtime: node
 * Governing contract: ADR 0005 (legacy decorators); ADR 0022 (test placement); ADR 0295 (decision 5: generated tool
 *                     configs).
 */
import { defineConfig, mergeConfig, type ViteUserConfig } from "vitest/config";

import { servicePreset } from "./service-preset.function.ts";
import { withCoverage } from "./with-coverage.function.ts";
import type { LibraryPresetOptions } from "../types/library-preset-options.type.ts";

/**
 * The service layout under the shared coverage gate, plus one jsdom project for the `react` folder
 * and one for the `native` folder when the package has them.
 */
export function libraryPreset({ root, react, native }: LibraryPresetOptions): ViteUserConfig {
  const config = servicePreset({ root });
  const projects = [
    react === undefined
      ? undefined
      : {
          extends: true as const,
          test: {
            name: "react",
            environment: "jsdom",
            include: [`${react}/**/__tests__/**/*.test.tsx`],
          },
        },
    native === undefined
      ? undefined
      : {
          extends: true as const,
          // React Native components render through react-native-web in jsdom.
          resolve: { alias: { "react-native": "react-native-web" } },
          test: {
            name: "native",
            environment: "jsdom",
            include: [`${native}/**/__tests__/**/*.test.tsx`],
          },
        },
  ].filter((project) => project !== undefined);
  if (projects.length === 0) return withCoverage(config);
  return withCoverage(mergeConfig(config, defineConfig({ test: { projects } })));
}
