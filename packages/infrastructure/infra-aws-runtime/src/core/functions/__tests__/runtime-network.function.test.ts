/**
 * Stackra file contract:
 * Purpose: unit tests of `runtimeNetwork`: reads the subnet and security group lists and the VPC of an environment's
 *          `shared.network`, ids and `ref:` values alike, leaves the VPC out when none is named, and reports each
 *          missing or malformed list, and a malformed VPC, with its path.
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

  it("reads the VPC as an id or a ref, and leaves it out when the runway names none", () => {
    const lists = { subnetIds: ["subnet-0a"], securityGroupIds: ["sg-01"] };
    expect(runtimeNetwork(rootWith({ ...lists, vpcId: "vpc-0abc" }), "staging").vpcId).toBe(
      "vpc-0abc",
    );
    expect(
      runtimeNetwork(rootWith({ ...lists, vpcId: "ref:network.staging.vpc" }), "staging").vpcId,
    ).toBe("ref:network.staging.vpc");
    expect(runtimeNetwork(rootWith(lists), "staging")).not.toHaveProperty("vpcId");
  });

  it("refuses a VPC that is not one id or ref", () => {
    try {
      runtimeNetwork(
        rootWith({ subnetIds: ["subnet-0a"], securityGroupIds: ["sg-01"], vpcId: ["vpc-0abc"] }),
        "staging",
      );
      throw new Error("Expected a RunwayInvalidError");
    } catch (error) {
      expect(error).toBeInstanceOf(RunwayInvalidError);
      expect((error as RunwayInvalidError).issues.map((issue) => issue.path)).toEqual([
        "environments.staging.shared.network.vpcId",
      ]);
    }
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

  it("reads the ECR pull-through registry as a host or a ref, and refuses anything else", () => {
    const base = { subnetIds: ["subnet-0a"], securityGroupIds: ["sg-01"] };

    expect(
      runtimeNetwork(
        rootWith({ ...base, registry: "111122223333.dkr.ecr.me-central-1.amazonaws.com" }),
        "staging",
      ).registry,
    ).toBe("111122223333.dkr.ecr.me-central-1.amazonaws.com");
    expect(
      runtimeNetwork(rootWith({ ...base, registry: "ref:ecr.staging.host" }), "staging").registry,
    ).toBe("ref:ecr.staging.host");
    expect(runtimeNetwork(rootWith(base), "staging")).not.toHaveProperty("registry");
    expect(() => runtimeNetwork(rootWith({ ...base, registry: "docker.io" }), "staging")).toThrow(
      RunwayInvalidError,
    );
  });
});
