/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./worker` entry: the Turnstile verifier the template's web wiring imports,
 *          and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#worker` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0127 2026-10-24 note.
 */
import { describe, expect, it } from "@stackra/testing";

import * as worker from "#worker/index";

describe("@stackra/platform/worker", () => {
  it("exports exactly the Turnstile verifier", () => {
    expect(Object.keys(worker)).toEqual(["TurnstileCaptchaVerifierDriver"]);
  });
});
