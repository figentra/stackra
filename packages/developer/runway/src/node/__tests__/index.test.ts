/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the template's Vite configs import `definesFor` and
 *          `devServer` from `@stackra/runway/node`; with `readRunway`, `runCommand`, the three provider drivers and the
 *          mobile job (`runMobileJob`, `capabilityConfig`), the brand step (`runBrandStep`, `committedBrandOutputs`,
 *          `BRAND_STEP_SETTINGS`) and the capture job (`screenshotCaptureJob`, `runScreenshotCapture`,
 *          `SCREENSHOT_CAPTURE_DEFAULTS`) those are its only values, none of them shared with `.`, and the types resolve.
 * Boundary: test only; imports the stand-in barrels through their aliases.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15); ADR 0439; ADR 0441.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as core from "#core/index";
import * as node from "#node/index";
import type {
  BrandStepRequest,
  BrandStepRun,
  DevServerOptions,
  MobileJobRequest,
  MobileJobResult,
  ScreenshotCaptureJob,
  ScreenshotCaptureRequest,
} from "#node/index";

describe("@stackra/runway/node", () => {
  it("exports exactly its values, none of them also exported by .", () => {
    expect(Object.keys(node).sort()).toEqual([
      "BRAND_STEP_SETTINGS",
      "EasProviderDriver",
      "EncoreCloudProviderDriver",
      "MintlifyProviderDriver",
      "SCREENSHOT_CAPTURE_DEFAULTS",
      "capabilityConfig",
      "committedBrandOutputs",
      "definesFor",
      "devServer",
      "readRunway",
      "runBrandStep",
      "runCommand",
      "runMobileJob",
      "runScreenshotCapture",
      "screenshotCaptureJob",
    ]);
    for (const name of Object.keys(node)) expect(Object.keys(core)).not.toContain(name);
  });

  it("types the template's Vite calls", () => {
    expectTypeOf(node.definesFor).parameters.toEqualTypeOf<[member: string, environment: string]>();
    expectTypeOf(node.definesFor).returns.toEqualTypeOf<Record<string, string>>();
    expectTypeOf(node.devServer).returns.toEqualTypeOf<DevServerOptions>();
    expectTypeOf(node.runMobileJob).parameters.toEqualTypeOf<[request: MobileJobRequest]>();
    expectTypeOf(node.runMobileJob).returns.toEqualTypeOf<Promise<MobileJobResult>>();
    expectTypeOf(node.runBrandStep).parameters.toEqualTypeOf<[request: BrandStepRequest]>();
    expectTypeOf(node.runBrandStep).returns.toEqualTypeOf<Promise<BrandStepRun[]>>();
    expectTypeOf(node.screenshotCaptureJob).parameters.toEqualTypeOf<
      [request: ScreenshotCaptureRequest]
    >();
    expectTypeOf(node.screenshotCaptureJob).returns.toEqualTypeOf<ScreenshotCaptureJob>();
  });
});
