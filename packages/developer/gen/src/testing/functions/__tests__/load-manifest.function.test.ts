/**
 * Stackra file contract:
 * Purpose: unit tests of `loadManifest`: a committed manifest read with its sections kept and every absent section
 *          present and empty, a typed broadcast, and a missing or non-manifest file refused with its path.
 * Boundary: test only; writes small files under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 10).
 */
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { loadManifest } from "#testing/functions/load-manifest.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

describe("loadManifest", () => {
  const root = writeFixtureMember("manifest", {
    "stackra.manifest.json": JSON.stringify({
      member: "commerce",
      package: "@acme/service-commerce",
      version: "1.0.0",
      events: [
        {
          name: "orders.order.paid.v1",
          module: "orders",
          class: "OrderPaid",
          kind: "integration",
          broadcast: {
            channel: "tenant.{tenantId}.orders",
            permission: "orders.order.read",
            audience: "tenant",
          },
        },
      ],
      ui: { resources: [] },
    }),
    "not-a-manifest.json": JSON.stringify({ hello: "world" }),
  });

  it("reads a manifest with every section present", async () => {
    const manifest = await loadManifest(join(root, "stackra.manifest.json"));
    expect(manifest.member).toBe("commerce");
    expect(manifest.actions).toEqual([]);
    expect(manifest.models).toEqual([]);
    expect(manifest["ui"]).toEqual({ resources: [] });
    const paid = manifest.events.find((event) => event.name === "orders.order.paid.v1");
    expect(paid?.broadcast?.permission).toBe("orders.order.read");
  });

  it("refuses a missing or foreign file", async () => {
    await expect(loadManifest(join(root, "missing.json"))).rejects.toThrow(
      /cannot read the manifest/,
    );
    await expect(loadManifest(join(root, "not-a-manifest.json"))).rejects.toThrow(
      /is not a stackra.manifest.json/,
    );
  });
});
