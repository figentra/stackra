/**
 * Stackra file contract:
 * Purpose: unit tests of the endpoint `valkeyCache` answers: the `host:port` of the instance's discovery connection,
 *          whichever entry and position it comes in and ignoring every other connection type, and an empty string when
 *          the instance has no discovery connection or reports no endpoints yet (a preview, the mocks).
 * Boundary: test only; Pulumi's mocks, with the Memorystore instance's state carrying the endpoints the provider would
 *           report. No engine and no cloud call (ADR 0171: agents never apply a stack). The instance's inputs are
 *           `gcpRuntime`'s test (`gcp-runtime.function.test.ts`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decisions 1 and 5); ADR 0354.
 */
import * as pulumi from "@pulumi/pulumi";
import { describe, expect, it } from "@stackra/testing";

import type { GcpRuntimeConfig } from "#core/types/gcp-runtime-config.type";
import { valkeyCache } from "#node/functions/valkey-cache.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";
import { outputOf } from "#testing/functions/output-of.function";

const CACHE: NonNullable<GcpRuntimeConfig["cache"]> = {
  node: "STANDARD_SMALL",
  shards: 1,
  replicas: 0,
  eviction: null,
  auth: "iam",
  network: "ref:gcp.network.prod",
  subnet: null,
};

const PLACEMENT = {
  prefix: "acme-production",
  project: "acme-prod",
  region: "me-central2",
  labels: { project: "acme" },
};

/** What the provider reports for an instance: connections in the endpoint entries, of the given types. */
const connection = (connectionType: string, ipAddress: string, port: number) => ({
  pscAutoConnection: { connectionType, ipAddress, port },
});

/**
 * The endpoint `valkeyCache` answers for an instance whose provider state carries `endpoints`: the mocks replaced by
 * ones that add the endpoints to the instance's state (`undefined` leaves them unset).
 */
async function endpointFor(endpoints: unknown): Promise<string> {
  await mockPulumi({ gcp: { network: { prod: "projects/acme-prod/global/networks/main" } } });
  await pulumi.runtime.setMocks(
    {
      newResource(args) {
        const inputs = args.inputs as Record<string, unknown>;
        const isInstance = args.type === "gcp:memorystore/instance:Instance";
        return {
          id: `${args.name}-id`,
          state: { ...inputs, ...(isInstance && endpoints !== undefined ? { endpoints } : {}) },
        };
      },
      call: (args) => args.inputs as Record<string, unknown>,
    },
    "project",
    "stack",
    false,
  );
  return outputOf(valkeyCache(CACHE, PLACEMENT, {}).endpoint);
}

describe("valkeyCache endpoint", () => {
  it("is the host and port of the discovery connection", async () => {
    expect(
      await endpointFor([
        { connections: [connection("CONNECTION_TYPE_DISCOVERY", "10.1.2.3", 6379)] },
      ]),
    ).toBe("10.1.2.3:6379");
  });

  it("finds the discovery connection among other connection types, entries and positions", async () => {
    expect(
      await endpointFor([
        { connections: undefined },
        {
          connections: [
            connection("CONNECTION_TYPE_PRIMARY", "10.9.9.1", 6380),
            { pscConnection: { ipAddress: "10.9.9.2" } },
          ],
        },
        { connections: [connection("CONNECTION_TYPE_DISCOVERY", "10.1.2.3", 6379)] },
      ]),
    ).toBe("10.1.2.3:6379");
  });

  it("is empty when no connection is the discovery one", async () => {
    expect(
      await endpointFor([
        { connections: [connection("CONNECTION_TYPE_PRIMARY", "10.9.9.1", 6380)] },
      ]),
    ).toBe("");
    expect(await endpointFor([])).toBe("");
  });

  it("is empty while the instance reports no endpoints, as in a preview", async () => {
    expect(await endpointFor(undefined)).toBe("");
  });
});
