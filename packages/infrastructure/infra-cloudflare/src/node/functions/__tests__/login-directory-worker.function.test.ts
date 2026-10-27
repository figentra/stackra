/**
 * Stackra file contract:
 * Purpose: unit tests of `loginDirectoryWorker`: one global KV namespace (no jurisdiction), one route per pattern on
 *          its zone, and a refusal for a route on a zone without an id.
 * Boundary: test only; Pulumi under mocks, so no provider or cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0451.
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { loginDirectoryWorker } from "#node/functions/login-directory-worker.function";
import {
  declaredAs,
  inputsByName,
  mockPulumi,
  settled,
  type DeclaredResource,
} from "#node/functions/__tests__/fixtures/pulumi-mocks.fixture";

let declared: DeclaredResource[];

beforeEach(async () => {
  declared = await mockPulumi();
});

describe("loginDirectoryWorker", () => {
  it("declares a global namespace and the routes", async () => {
    const directory = loginDirectoryWorker({
      accountId: "acc-1",
      script: "figentra-login-directory",
      zoneIds: { "mezzora.com": "zone-mz", "organza.com": "zone-oz" },
      routes: {
        "mezzora.com": ["login.mezzora.com/directory"],
        "organza.com": ["login.organza.com/directory"],
      },
    });
    await settled(directory);

    expect(
      inputsByName(declared, "cloudflare:index/workersKvNamespace:WorkersKvNamespace"),
    ).toEqual({
      "figentra-login-directory-kv": {
        accountId: "acc-1",
        title: "figentra-login-directory-directory",
      },
    });
    expect(inputsByName(declared, "cloudflare:index/workersRoute:WorkersRoute")).toEqual({
      "figentra-login-directory-mezzora.com-route-0": {
        zoneId: "zone-mz",
        pattern: "login.mezzora.com/directory",
        script: "figentra-login-directory",
      },
      "figentra-login-directory-organza.com-route-0": {
        zoneId: "zone-oz",
        pattern: "login.organza.com/directory",
        script: "figentra-login-directory",
      },
    });
    expect(declaredAs(declared, "cloudflare:index/workersRoute:WorkersRoute")).toHaveLength(2);
  });

  it("refuses a route on an unknown zone", () => {
    expect(() =>
      loginDirectoryWorker({
        accountId: "acc-1",
        script: "dir",
        zoneIds: {},
        routes: { "x.com": ["x.com/d"] },
      }),
    ).toThrow(RangeError);
  });
});
