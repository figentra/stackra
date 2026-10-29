/**
 * Stackra file contract:
 * Purpose: unit tests of `uptimeMonitors`: one Better Stack monitor per planned URL with its interval, mailing and
 *          pushing the on-call person; a plain status check for a 2xx host and an expected-status-code check for a host
 *          whose healthy answer is another code.
 * Boundary: test only; Pulumi under mocks, so no provider or cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0185 (decision 1). STA-1573.
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import {
  inputsByName,
  mockPulumi,
  settled,
  type DeclaredResource,
} from "#node/functions/__tests__/fixtures/pulumi-mocks.fixture";
import { uptimeMonitors } from "#node/functions/uptime-monitors.function";

let declared: DeclaredResource[];

beforeEach(async () => {
  declared = await mockPulumi();
});

describe("uptimeMonitors", () => {
  it("declares one monitor per planned URL", async () => {
    const result = uptimeMonitors({
      project: "stackra",
      uptime: [
        {
          environment: "production",
          name: "registry",
          url: "https://npm.stackra.figentra.com/-/ping",
          checkFrequencySeconds: 60,
          expectedStatusCodes: null,
        },
        {
          environment: "production",
          name: "turbo-cache",
          url: "https://turbo.stackra.figentra.com/v8/artifacts/status",
          checkFrequencySeconds: 180,
          expectedStatusCodes: [401],
        },
      ],
    });
    await settled(result);

    expect(inputsByName(declared, "better-uptime:index/monitor:Monitor")).toEqual({
      "uptime-production.registry": {
        pronounceableName: "stackra production registry",
        url: "https://npm.stackra.figentra.com/-/ping",
        checkFrequency: 60,
        monitorType: "status",
        email: true,
        push: true,
      },
      "uptime-production.turbo-cache": {
        pronounceableName: "stackra production turbo-cache",
        url: "https://turbo.stackra.figentra.com/v8/artifacts/status",
        checkFrequency: 180,
        monitorType: "expected_status_code",
        expectedStatusCodes: [401],
        email: true,
        push: true,
      },
    });
  });

  it("declares nothing without targets", () => {
    expect(uptimeMonitors({ project: "stackra", uptime: [] })).toEqual({ monitors: [] });
    expect(declared).toEqual([]);
  });
});
