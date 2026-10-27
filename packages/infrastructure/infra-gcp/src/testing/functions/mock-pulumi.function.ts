/**
 * Stackra file contract:
 * Purpose: `mockPulumi(config?)`, Pulumi's unit-test mocks for an infra-gcp program: no engine, no cloud call. Every
 *          resource registers with its inputs as its state plus a fake `name` and `email` and the id `<name>-id`, so
 *          outputs resolve; the given stack config (`{ gcp: { projects: { prod: { id: "acme-prod" } } } }`) is what
 *          `ref:` values read.
 * Boundary: tests only; it replaces Pulumi's runtime for the whole test file. The project is `project` and the stack
 *           `stack`, so a config key is read as `project:<key>`.
 * Runtime: node
 * Governing contract: ADR 0171 (agents never apply a stack), ADR 0269 (testing helpers), ADR 0022 (tests beside the
 *                     subject).
 */
import * as pulumi from "@pulumi/pulumi";

import type { MockedResource } from "#testing/types/mocked-resource.type";
import type { PulumiMock } from "#testing/types/pulumi-mock.type";

/** Milliseconds between two looks at the registered count. */
const TICK = 20;

/**
 * Installs the mocks and the stack config.
 *
 * @example
 * const pulumiMock = await mockPulumi({ gcp: { projects: { prod: { id: "acme-prod", number: "123" } } } });
 * gcpBaseline(config);
 * const bucket = await pulumiMock.find("gcp:storage/bucket:Bucket", "acme-production-files");
 */
export async function mockPulumi(
  config: Readonly<Record<string, unknown>> = {},
): Promise<PulumiMock> {
  const resources: MockedResource[] = [];
  // a component of the previous test registers its outputs late; drain it before the monitor that knows its URN goes
  await pulumi.runtime.disconnect();
  await pulumi.runtime.setMocks(
    {
      newResource(args) {
        const inputs = args.inputs as Record<string, unknown>;
        resources.push({ type: args.type, name: args.name, inputs });
        return {
          id: `${args.name}-id`,
          state: {
            ...inputs,
            name: inputs["name"] ?? args.name,
            email: `${args.name}@mock.iam.gserviceaccount.com`,
          },
        };
      },
      call: (args) => args.inputs as Record<string, unknown>,
    },
    "project",
    "stack",
    false,
  );
  pulumi.runtime.setAllConfig(
    Object.fromEntries(
      Object.entries(config).map(([key, value]) => [
        `project:${key}`,
        typeof value === "string" ? value : JSON.stringify(value),
      ]),
    ),
  );

  const settled = async (): Promise<readonly MockedResource[]> => {
    let seen = -1;
    while (seen !== resources.length) {
      seen = resources.length;
      await new Promise((resolve) => setTimeout(resolve, TICK));
    }
    return resources;
  };
  return {
    resources,
    settled,
    async find(type, name) {
      const found = (await settled()).find(
        (resource) =>
          resource.name === name &&
          (resource.type === type || resource.type.split(":").at(-1) === type),
      );
      if (found === undefined) throw new Error(`No ${type} named ${name} was registered`);
      return found;
    },
  };
}
