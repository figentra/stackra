/**
 * Stackra file contract:
 * Purpose: unit tests of `cloudProjectOf`: literal and `ref:` ids and numbers resolve; an id GCP would refuse and a
 *          number that is not digits fail naming the project.
 * Boundary: test only; the stack config is installed by `mockPulumi`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0354 (decision 4), ADR 0171 (`ref:` values).
 */
import { describe, expect, it } from "@stackra/testing";

import { cloudProjectOf } from "#node/functions/cloud-project-of.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";

describe("cloudProjectOf", () => {
  it("resolves a literal and a referenced project", async () => {
    await mockPulumi({ gcp: { projects: { prod: { id: "acme-prod", number: "42" } } } });

    expect(cloudProjectOf({ id: "acme-stg", number: "7" }, "staging")).toEqual({
      id: "acme-stg",
      number: "7",
    });
    expect(
      cloudProjectOf(
        { id: "ref:gcp.projects.prod.id", number: "ref:gcp.projects.prod.number" },
        "production",
      ),
    ).toEqual({ id: "acme-prod", number: "42" });
  });

  it("refuses an id GCP would not accept and a number that is not digits", async () => {
    await mockPulumi();

    expect(() =>
      cloudProjectOf({ id: "Acme Prod", number: "42" }, "the production project"),
    ).toThrow(/the production project id \(Acme Prod\) is not a GCP project id/);
    expect(() =>
      cloudProjectOf({ id: "acme-prod", number: "4e2" }, "the production project"),
    ).toThrow(/is not a GCP project number/);
  });
});
