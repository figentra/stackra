/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: the five symbols the template imports (`ScannerView`,
 *          `useCapability`, `useLaunchedFiles`, `usePlatform`, `usePushPermission`) and nothing else at run time.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); the STA-348 registry row.
 */
import { describe, expect, it } from "@stackra/testing";

import * as react from "#react/index";

describe("@stackra/platform/react", () => {
  it("exports exactly the registry row's six symbols", () => {
    expect(Object.keys(react).sort()).toEqual([
      "ScannerView",
      "useAppIcon",
      "useCapability",
      "useLaunchedFiles",
      "usePlatform",
      "usePushPermission",
    ]);
  });
});
