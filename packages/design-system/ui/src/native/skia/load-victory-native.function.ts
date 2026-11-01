/**
 * Stackra file contract:
 * Purpose: `loadVictoryNative()`, the `victory-native` module when the app has it, else the inert `SKIA_MISSING`:
 *          victory-native draws on Skia, so it is optional with it, and the native entry loads in an app that renders
 *          no Victory chart (STA-1791).
 * Boundary: required on first call, never imported, so Metro bundles the peer only when the app installed it (the
 *           build keeps this literal `require`: `optionalRequires` in tsdown.config.ts). Never throws.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (native charts on Skia); STA-1722 (lazy optional peers).
 */
import type * as VictoryNative from "victory-native";

import { SKIA_MISSING } from "#native/skia/skia-missing.constant";

let loaded: typeof VictoryNative | undefined;

/** The victory-native module, or the stand-in where the app has not installed it. */
export function loadVictoryNative(): typeof VictoryNative {
  if (loaded === undefined) {
    try {
      // oxlint-disable-next-line typescript/no-require-imports -- an optional peer, required on first use so an app without it still runs
      loaded = require("victory-native") as typeof VictoryNative;
    } catch {
      loaded = SKIA_MISSING as typeof VictoryNative;
    }
  }
  return loaded;
}
