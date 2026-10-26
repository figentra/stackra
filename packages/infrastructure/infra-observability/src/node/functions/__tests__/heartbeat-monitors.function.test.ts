/**
 * Stackra file contract:
 * Purpose: unit tests of `heartbeatMonitors`: one Better Stack heartbeat per planned beat with its period and grace,
 *          mailing and pushing the on-call person, and each URL as a secret output keyed by environment, service and
 *          job.
 * Boundary: test only; Pulumi under mocks, so no provider or cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0184 (decision 4), ADR 0185 (decision 1).
 */
import * as pulumi from "@pulumi/pulumi";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { HeartbeatKind } from "#core/enums/heartbeat-kind.enum";
import {
  inputsByName,
  mockPulumi,
  settled,
  valueOf,
  type DeclaredResource,
} from "#node/functions/__tests__/fixtures/pulumi-mocks.fixture";
import { heartbeatMonitors } from "#node/functions/heartbeat-monitors.function";

let declared: DeclaredResource[];

beforeEach(async () => {
  declared = await mockPulumi();
});

describe("heartbeatMonitors", () => {
  it("declares one heartbeat per planned beat and returns its secret URL", async () => {
    const beat = {
      service: "commerce",
      kind: HeartbeatKind.Cron,
      name: "nightly-export",
      periodSeconds: 86_400,
      graceSeconds: 17_280,
    };
    const monitors = heartbeatMonitors({
      project: "acme-platform",
      heartbeats: [
        { ...beat, environment: "staging" },
        { ...beat, environment: "production" },
      ],
    });
    await settled(monitors);

    expect(inputsByName(declared, "better-uptime:index/heartbeat:Heartbeat")).toEqual({
      "heartbeat-staging.commerce.nightly-export": {
        name: "acme-platform staging commerce/nightly-export",
        period: 86_400,
        grace: 17_280,
        email: true,
        push: true,
      },
      "heartbeat-production.commerce.nightly-export": {
        name: "acme-platform production commerce/nightly-export",
        period: 86_400,
        grace: 17_280,
        email: true,
        push: true,
      },
    });
    const url = monitors.urls["production"]?.["commerce"]?.["nightly-export"];
    if (url === undefined) throw new Error("no nightly-export heartbeat url");
    expect(await valueOf(url)).toBe(
      "https://uptime.betterstack.test/heartbeat-production.commerce.nightly-export",
    );
    expect(await pulumi.isSecret(url)).toBe(true);
  });

  it("declares nothing without heartbeats", async () => {
    const monitors = heartbeatMonitors({ project: "acme-platform", heartbeats: [] });

    expect(monitors).toEqual({ heartbeats: [], urls: {} });
    expect(declared).toEqual([]);
  });
});
