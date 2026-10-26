/**
 * Stackra file contract:
 * Purpose: unit tests of `CloudflareKvEdgeStoreDriver`: with no Cloudflare client wired, put and delete reject with
 *          `RunwayNotConfiguredError` naming the `EdgeStore` port.
 * Boundary: test only; nothing is contacted.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayNotConfiguredError } from "#core/errors/runway-not-configured.error";
import { CloudflareKvEdgeStoreDriver } from "#node/drivers/cloudflare-kv-edge-store.driver";

describe("CloudflareKvEdgeStoreDriver", () => {
  it("rejects put and delete with RunwayNotConfiguredError", async () => {
    const store = new CloudflareKvEdgeStoreDriver();

    await expect(store.put("host:a.example.com", "{}")).rejects.toMatchObject({
      name: "RunwayNotConfiguredError",
      port: "EdgeStore",
    });
    await expect(store.delete("host:a.example.com")).rejects.toBeInstanceOf(
      RunwayNotConfiguredError,
    );
  });
});
