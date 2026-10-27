/**
 * Stackra file contract:
 * Purpose: unit tests of `readServiceCatalogues`: the lang of a consumed service found beside the member, owned by the
 *          service's package with its folder relative to the member root; a service without `assets/lang` skipped
 *          (STA-1363).
 * Boundary: test only; writes small fixtures under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0080; ADR 0260 (decision 3); STA-1363.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { readServiceCatalogues } from "#node/functions/read-service-catalogues.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

/** A committed service manifest, as much as the reader looks at. */
const manifestOf = (member: string): StackraManifest =>
  ({ member, package: `@acme/service-${member}` }) as unknown as StackraManifest;

describe("readServiceCatalogues", () => {
  it("reads a consumed service's lang beside the member, with its folder relative to the member", () => {
    const root = writeFixtureMember("console", {
      "../commerce/stackra.manifest.json": JSON.stringify(manifestOf("commerce")),
      "../commerce/assets/lang/en/orders.json": JSON.stringify({ title: "Orders" }),
      "../commerce/assets/lang/ar/orders.json": JSON.stringify({ title: "الطلبات" }),
      "../notifications/stackra.manifest.json": JSON.stringify(manifestOf("notifications")),
    });
    expect(
      readServiceCatalogues(root, [
        { member: "notifications", folder: "notifications", manifest: manifestOf("notifications") },
        { member: "commerce", folder: "commerce", manifest: manifestOf("commerce") },
      ]),
    ).toEqual([
      {
        package: "@acme/service-commerce",
        from: "../commerce/assets/lang",
        catalogues: {
          ar: { orders: { title: "الطلبات" } },
          en: { orders: { title: "Orders" } },
        },
      },
    ]);
  });

  it("reads nothing for a service with no folder", () => {
    const root = writeFixtureMember("lonely", {});
    expect(
      readServiceCatalogues(root, [{ member: "billing", manifest: manifestOf("billing") }]),
    ).toEqual([]);
  });
});
