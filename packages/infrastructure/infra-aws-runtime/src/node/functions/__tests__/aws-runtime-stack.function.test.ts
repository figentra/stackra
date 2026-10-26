/**
 * Stackra file contract:
 * Purpose: unit tests of `awsRuntimeStack` under Pulumi's mocks: one service of a throwaway repository deploys through
 *          the runtime stack: its queue is declared and another service's is not, and the cache network is the root
 *          runway's `shared.network` with its `ref:` values resolved from the stack config.
 * Boundary: test only; writes a throwaway repository in the OS temp directory; no cloud is called.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171, ADR 0402.
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
  directory = mkdtempSync(join(tmpdir(), "stackra-runtime-stack-"));
  write(
    "runway.yaml",
    "version: 3",
    "project: acme",
    "environments:",
    "  staging:",
    "    shared:",
    "      cache:",
    "        engine: valkey",
    "      network:",
    "        subnetIds:",
    "          - ref:network.staging.a",
    "          - subnet-0b",
    "        securityGroupIds:",
    "          - sg-01",
  );
  for (const member of ["commerce", "notifications"])
    write(
      `services/${member}/runway.yaml`,
      "version: 3",
      "environments:",
      "  staging:",
      "    queues:",
      "      default:",
      "        visibilityTimeoutSeconds: 60",
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
    "project:network": JSON.stringify({ staging: { a: "subnet-0a" } }),
  });
  awsRuntimeStack({ directory, environment: "staging", members: ["commerce"] });
  let count = -1;
  while (count !== registered.length) {
    count = registered.length;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe("awsRuntimeStack", () => {
  it("declares only the deployed service's resources", () => {
    const queues = registered
      .filter((entry) => entry.type.endsWith(":Queue"))
      .map((entry) => entry.name);
    expect(queues).toEqual(["acme-staging-commerce-default"]);
  });

  it("puts the shared cache on the runway's network, refs resolved", () => {
    const group = registered.find((entry) => entry.type.endsWith(":SubnetGroup"));
    expect(group?.inputs["subnetIds"]).toEqual(["subnet-0a", "subnet-0b"]);
    const cache = registered.find((entry) => entry.type.endsWith(":ReplicationGroup"));
    expect(cache?.inputs["securityGroupIds"]).toEqual(["sg-01"]);
  });
});
