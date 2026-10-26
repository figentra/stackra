/**
 * Stackra file contract:
 * Purpose: unit tests of `runtimeNetwork`: reads the subnet and security group lists of an environment's
 *          `shared.network`, ids and `ref:` values alike, and reports each missing or malformed list with its path.
 * Boundary: test only; roots are built through `parseRunway`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decision 4), ADR 0402.
 */
import { parseRunway, RunwayInvalidError } from "@stackra/runway";
import { describe, expect, it } from "@stackra/testing";

import { runtimeNetwork } from "#core/functions/runtime-network.function";

/** A root runway whose staging network is `network`. */
const rootWith = (network: Record<string, unknown>) =>
  parseRunway("root", {
    version: 3,
    project: "acme",
    environments: { staging: { shared: { network } } },
  });

describe("runtimeNetwork", () => {
  it("reads the subnets and security groups", () => {
    expect(
      runtimeNetwork(
        rootWith({
          subnetIds: ["ref:network.staging.a", "subnet-0abc"],
          securityGroupIds: ["sg-01"],
        }),
        "staging",
      ),
    ).toEqual({ subnetIds: ["ref:network.staging.a", "subnet-0abc"], securityGroupIds: ["sg-01"] });
  });

  it("reports each missing or malformed list", () => {
    try {
      runtimeNetwork(rootWith({ subnetIds: ["not an id"] }), "staging");
      throw new Error("Expected a RunwayInvalidError");
    } catch (error) {
      expect(error).toBeInstanceOf(RunwayInvalidError);
      expect((error as RunwayInvalidError).issues.map((issue) => issue.path)).toEqual([
        "environments.staging.shared.network.subnetIds",
        "environments.staging.shared.network.securityGroupIds",
      ]);
    }
  });
});
