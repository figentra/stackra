/**
 * Stackra file contract:
 * Purpose: unit tests of `projectProvider` under Pulumi's mocks: the provider names its project and region, stamps the
 *          labels and bills its quota to the same project.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0354 (decision 3), ADR 0172 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { projectProvider } from "#node/functions/project-provider.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";

/** A value a provider may receive JSON-encoded. */
function decoded(value: unknown): unknown {
  return typeof value === "string" && /^([[{]|true$|false$)/.test(value)
    ? JSON.parse(value)
    : value;
}

describe("projectProvider", () => {
  it("pins the project and region and stamps the labels", async () => {
    const engine = await mockPulumi();
    projectProvider(
      "acme-staging",
      { project: "acme-stg", region: "europe-west3", labels: { env: "staging" } },
      {},
    );

    const provider = await engine.find("pulumi:providers:gcp", "acme-staging");
    expect(provider.inputs).toMatchObject({
      project: "acme-stg",
      region: "europe-west3",
      billingProject: "acme-stg",
    });
    expect(decoded(provider.inputs["defaultLabels"])).toEqual({ env: "staging" });
    expect(decoded(provider.inputs["userProjectOverride"])).toBe(true);
  });
});
