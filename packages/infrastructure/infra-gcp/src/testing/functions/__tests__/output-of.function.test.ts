/**
 * Stackra file contract:
 * Purpose: unit tests of `outputOf`: a plain output and an applied one resolve to their values.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (testing helpers in the owner package).
 */
import * as pulumi from "@pulumi/pulumi";
import { describe, expect, it } from "@stackra/testing";

import { mockPulumi } from "#testing/functions/mock-pulumi.function";
import { outputOf } from "#testing/functions/output-of.function";

describe("outputOf", () => {
  it("resolves an output and an applied output", async () => {
    await mockPulumi();

    expect(await outputOf(pulumi.output("acme"))).toBe("acme");
    expect(await outputOf(pulumi.output(2).apply((value) => value * 3))).toBe(6);
  });
});
