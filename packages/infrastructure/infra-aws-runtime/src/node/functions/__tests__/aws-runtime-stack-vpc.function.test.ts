/**
 * Stackra file contract:
 * Purpose: unit tests of `awsRuntimeStack` with a workload, under Pulumi's mocks: the whole environment's stack reads
 *          the VPC from the root runway's `shared.network.vpcId` (a `ref:` resolved from the stack config) and puts the
 *          workload security group and the workload's private namespace in it. Before, the stack passed no VPC and every
 *          plan with a workload or a database failed with "Name the VPC (network.vpcId)".
 * Boundary: test only; writes a throwaway repository in the OS temp directory; no cloud is called.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decision 4), ADR 0402, ADR 0493.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import * as pulumi from "@pulumi/pulumi";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { awsRuntimeStack } from "#node/functions/aws-runtime-stack.function";

/** One resource the program registered. */
type Registered = {
  readonly type: string;
  readonly name: string;
  readonly inputs: Record<string, unknown>;
};

const registered: Registered[] = [];
let directory: string;

/** Writes `lines` to `path` inside the throwaway repository. */
function write(path: string, ...lines: string[]): void {
  const file = join(directory, path);
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, `${lines.join("\n")}\n`);
}

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), "stackra-runtime-stack-vpc-"));
  write(
    "runway.yaml",
    "version: 3",
    "project: acme",
    "environments:",
    "  staging:",
    "    shared:",
    "      network:",
    "        vpcId: ref:network.staging.vpc",
    "        subnetIds:",
    "          - subnet-0a",
    "        securityGroupIds:",
    "          - sg-01",
    "workloads:",
    "  pdf:",
    `    image: ghcr.io/acme/pdf@sha256:${"a".repeat(64)}`,
    "    port: 3000",
    "    health: /health",
    "    reason: The documents service renders PDFs through it",
  );
  await pulumi.runtime.setMocks(
    {
      newResource: (args) => {
        registered.push({
          type: args.type,
          name: args.name,
          inputs: args.inputs as Record<string, unknown>,
        });
        return { id: `${args.name}-id`, state: args.inputs };
      },
      call: (args) => args.inputs as Record<string, unknown>,
    },
    "project",
    "staging",
    false,
  );
  pulumi.runtime.setAllConfig({
    "project:network": JSON.stringify({ staging: { vpc: "vpc-0abc" } }),
  });
  awsRuntimeStack({ directory, environment: "staging" });
  let count = -1;
  while (count !== registered.length) {
    count = registered.length;
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
  }
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe("awsRuntimeStack with a workload", () => {
  it("puts the workload security group and namespace in the runway's VPC, its ref resolved", () => {
    const groups = registered.filter((entry) => entry.type.endsWith(":SecurityGroup"));
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.every((group) => group.inputs["vpcId"] === "vpc-0abc")).toBe(true);
    const namespace = registered.find((entry) => entry.type.endsWith(":PrivateDnsNamespace"));
    expect(namespace?.inputs["vpc"]).toBe("vpc-0abc");
  });
});
