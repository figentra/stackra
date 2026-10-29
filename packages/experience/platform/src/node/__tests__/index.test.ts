/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the Turnstile verifier a Node service binds, the same class
 *          `./worker` exports, and nothing else.
 * Boundary: test only; imports the stand-in barrels through their `#node` and `#worker` aliases.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0127 2026-10-26 note.
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";
import * as worker from "#worker/index";

describe("@stackra/platform/node", () => {
  it("exports exactly the Turnstile verifier and the APNs Live Activity pushes", () => {
    expect(Object.keys(node).sort()).toEqual([
      "ApnsLiveActivityPushesDriver",
      "TurnstileCaptchaVerifierDriver",
    ]);
  });

  it("exports the same class as ./worker, so one binding serves both runtimes", () => {
    expect(node.TurnstileCaptchaVerifierDriver).toBe(worker.TurnstileCaptchaVerifierDriver);
  });
});
