/**
 * Stackra file contract:
 * Purpose: `servicePreset`, the vitest config of a service: unit and int tests as two projects, legacy decorators on.
 * Boundary: test layout only: projects, environments, the coverage gate.
 * Runtime: node
 * Governing contract: ADR 0005 (legacy decorators); ADR 0022 (test placement); ADR 0295 (decision 5: generated tool
 *                     configs); ADR 0182 (the int tier globs, `INT_TESTS`).
 */
import { configDefaults, defineConfig, mergeConfig, type ViteUserConfig } from "vitest/config";

import { INT_TESTS } from "../constants/int-tests.constant.ts";
import { stackraVitestDecorators } from "../constants/stackra-vitest-decorators.constant.ts";
import { UNIT_TESTS } from "../constants/unit-tests.constant.ts";
import type { ServicePresetOptions } from "../types/service-preset-options.type.ts";

/** Unit tests (`.test.ts`) and integration tests (`.int.test.ts`) as two projects, legacy decorators on. */
export function servicePreset({ root, exclude = [] }: ServicePresetOptions): ViteUserConfig {
  return mergeConfig(
    stackraVitestDecorators,
    defineConfig({
      root,
      test: {
        projects: [
          {
            extends: true,
            test: {
              name: "unit",
              include: [UNIT_TESTS],
              exclude: [...configDefaults.exclude, ...INT_TESTS, ...exclude],
            },
          },
          {
            extends: true,
            test: {
              name: "int",
              include: [...INT_TESTS],
              exclude: [...configDefaults.exclude, ...exclude],
            },
          },
        ],
      },
    }),
  );
}
