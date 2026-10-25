/**
 * Stackra file contract:
 * Purpose: unit tests of `endpointOf`: the endpoint of a consumed key comes from the service manifest the app's
 *          `consumes` names, resolved against the nearest folder above the member root, and an unconsumed key throws.
 * Boundary: test only; writes a throwaway repository under the OS temp folder and removes it after.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 6).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "@stackra/testing";

import { endpointOf } from "#e2e/api-calls/endpoint-of.function";

/** A repository with one app consuming one service. */
const REPO = mkdtempSync(join(tmpdir(), "stackra-e2e-"));
const APP = join(REPO, "apps", "console");
mkdirSync(APP, { recursive: true });
mkdirSync(join(REPO, "services", "commerce"), { recursive: true });
writeFileSync(
  join(APP, "stackra.manifest.json"),
  JSON.stringify({
    consumes: [{ service: "commerce", manifest: "services/commerce/stackra.manifest.json" }],
  }),
);
writeFileSync(
  join(REPO, "services", "commerce", "stackra.manifest.json"),
  JSON.stringify({
    actions: [
      { key: "orders.order.create@1", endpoint: { method: "POST", path: "/orders" } },
      { key: "orders.order.internal@1" },
    ],
  }),
);

afterAll(() => {
  rmSync(REPO, { recursive: true, force: true });
});

describe(endpointOf, () => {
  it("reads the endpoint from the consumed service's manifest", () => {
    expect(endpointOf(APP, "orders.order.create@1")).toEqual({ method: "POST", path: "/orders" });
  });

  it("refuses a key the app does not consume or that has no endpoint", () => {
    expect(() => endpointOf(APP, "orders.order.cancel@1")).toThrow(RangeError);
    expect(() => endpointOf(APP, "orders.order.internal@1")).toThrow(RangeError);
  });
});
