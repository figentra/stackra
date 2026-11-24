/**
 * Stackra file contract:
 * Purpose: unit tests of `apiCalls`: the calls of a consumed key are the recorded requests that match its endpoint (method and path, a
 *          path parameter matching one segment), in the order they finished, and a key the app does not consume is refused.
 * Boundary: test only; the project's testDir is a stub and the manifests `endpointOf` reads are a throwaway repository.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { API_CALL_LOG } from "#e2e/api-calls/api-call-log.constant";
import { apiCalls } from "#e2e/api-calls/api-calls.function";

const { info } = vi.hoisted(() => ({ info: vi.fn() }));
vi.mock("@playwright/test", () => ({ test: { info } }));

const REPO = mkdtempSync(join(tmpdir(), "stackra-e2e-calls-"));
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
      { key: "orders.order.get@1", endpoint: { method: "GET", path: "/orders/:id" } },
    ],
  }),
);

afterAll(() => {
  rmSync(REPO, { recursive: true, force: true });
});

beforeEach(() => {
  info.mockReturnValue({ project: { testDir: APP } });
  API_CALL_LOG.length = 0;
});

describe("apiCalls", () => {
  it("returns the recorded calls that match the key's endpoint, in order", () => {
    API_CALL_LOG.push(
      { method: "POST", url: "http://app.test/orders", headers: {} },
      { method: "GET", url: "http://app.test/orders/ord_1", headers: {} },
      { method: "POST", url: "http://app.test/orders/", headers: { a: "b" } },
      { method: "POST", url: "http://app.test/invoices", headers: {} },
    );
    expect(apiCalls("orders.order.create@1").map((call) => call.url)).toEqual([
      "http://app.test/orders",
      "http://app.test/orders/",
    ]);
    expect(apiCalls("orders.order.get@1").map((call) => call.url)).toEqual([
      "http://app.test/orders/ord_1",
    ]);
  });

  it("returns none when nothing was recorded", () => {
    expect(apiCalls("orders.order.create@1")).toEqual([]);
  });

  it("refuses a key the app does not consume", () => {
    expect(() => apiCalls("orders.order.cancel@1")).toThrow(RangeError);
  });
});
