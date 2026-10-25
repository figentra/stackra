/**
 * Stackra file contract:
 * Purpose: unit tests of `policyOf`: the statements wrapped in a 2012-10-17 policy document as JSON text, with
 *          Pulumi outputs inside a statement resolved.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (the Pulumi programs).
 */
import * as pulumi from "@pulumi/pulumi";
import { describe, expect, it } from "@stackra/testing";

import { policyOf } from "#node/functions/policy-of.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";
import { outputOf } from "#testing/functions/output-of.function";

describe("policyOf", () => {
  it("wraps the statements in a versioned document", async () => {
    await mockPulumi();
    const statement = { Effect: "Allow", Action: "s3:GetObject", Resource: "*" };

    expect(JSON.parse(await outputOf(policyOf([statement])))).toEqual({
      Version: "2012-10-17",
      Statement: [statement],
    });
  });

  it("resolves an output inside a statement", async () => {
    await mockPulumi();
    const policy = policyOf([{ Effect: "Deny", Resource: pulumi.output("arn:aws:s3:::acme") }]);

    expect(JSON.parse(await outputOf(policy)).Statement).toEqual([
      { Effect: "Deny", Resource: "arn:aws:s3:::acme" },
    ]);
  });
});
