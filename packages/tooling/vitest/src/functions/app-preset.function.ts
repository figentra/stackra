/**
 * Stackra file contract:
 * Purpose: `appPreset`, the vitest config of a Vite or React Router app: jsdom for every test, a node project per node
 *          folder.
 * Boundary: test layout only: projects, environments, the coverage gate.
 * Runtime: node
 * Governing contract: ADR 0005 (legacy decorators); ADR 0022 (test placement); ADR 0295 (decision 5: generated tool
 *                     configs).
 */
import { configDefaults, defineConfig, mergeConfig, type ViteUserConfig } from "vitest/config";

import { ALL_TESTS } from "../constants/all-tests.constant.ts";
import { reactWithDecorators } from "../constants/react-with-decorators.constant.ts";
import type { AppPresetOptions } from "../types/app-preset-options.type.ts";

/** jsdom for every test, except the `nodeFolders`, which get a node-environment project each. */
export function appPreset({
  root,
  nodeFolders = [],
  exclude = [],
}: AppPresetOptions): ViteUserConfig {
  return mergeConfig(
    reactWithDecorators,
    defineConfig({
      root,
      test: {
        projects: [
          {
            extends: true,
            test: {
              name: "jsdom",
              include: [ALL_TESTS],
              exclude: [
                ...configDefaults.exclude,
                ...nodeFolders.map((folder) => `${folder}/**`),
                ...exclude,
              ],
            },
          },
          ...nodeFolders.map((folder) => ({
            extends: true as const,
            test: {
              name: folder,
              environment: "node",
              include: [`${folder}/**/__tests__/**/*.test.ts`],
              exclude: [...configDefaults.exclude, ...exclude],
            },
          })),
        ],
      },
    }),
  );
}
