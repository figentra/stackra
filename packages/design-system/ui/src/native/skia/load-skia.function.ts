/**
 * Stackra file contract:
 * Purpose: `loadSkia()`, the `@shopify/react-native-skia` module when the app has it, else the inert `SKIA_MISSING`, so
 *          the native entry loads in an app that renders no Skia-backed chart, map or export (an optional peer,
 *          STA-1791).
 * Boundary: required on first call, never imported, so Metro bundles the peer only when the app installed it (the
 *           build keeps this literal `require`: `optionalRequires` in tsdown.config.ts). Never throws.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (native charts on Skia); STA-1722 (lazy optional peers).
 */
import type * as SkiaModule from "@shopify/react-native-skia";

import { SKIA_MISSING } from "#native/skia/skia-missing.constant";

let loaded: typeof SkiaModule | undefined;

/** The Skia module, or the stand-in where the app has not installed `@shopify/react-native-skia`. */
export function loadSkia(): typeof SkiaModule {
  if (loaded === undefined) {
    try {
      // oxlint-disable-next-line typescript/no-require-imports -- an optional peer, required on first use so an app without it still runs
      loaded = require("@shopify/react-native-skia") as typeof SkiaModule;
    } catch {
      loaded = SKIA_MISSING as typeof SkiaModule;
    }
  }
  return loaded;
}
