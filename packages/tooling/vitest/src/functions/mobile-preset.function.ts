/**
 * Stackra file contract:
 * Purpose: `mobilePreset`, the vitest config of the Expo app: jsdom with legacy decorators.
 * Boundary: test layout only: projects, environments, the coverage gate.
 * Runtime: node
 * Governing contract: ADR 0005 (legacy decorators); ADR 0022 (test placement); ADR 0295 (decision 5: generated tool
 *                     configs).
 */
import { defineConfig, mergeConfig, type ViteUserConfig } from "vitest/config";

import { ALL_TESTS } from "../constants/all-tests.constant.ts";
import { reactWithDecorators } from "../constants/react-with-decorators.constant.ts";
import type { MobilePresetOptions } from "../types/mobile-preset-options.type.ts";

/** jsdom with legacy decorators for the mobile app's `.test.ts` and `.test.tsx` files. */
export function mobilePreset({ root }: MobilePresetOptions): ViteUserConfig {
  return mergeConfig(reactWithDecorators, defineConfig({ root, test: { include: [ALL_TESTS] } }));
}
