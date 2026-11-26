/**
 * Stackra file contract:
 * Purpose: unit tests of `deprecationsOf` and the manifest it feeds: one entry per deprecated class (its kind code and
 *          locked identity), field and trait, sorted by name then member; `buildManifest` writes the section, marks the
 *          action and event entries `deprecated` and the field's JSON Schema `deprecated: true` with its sunset, and a
 *          member that deprecates nothing gets no section (so no committed manifest changes).
 * Boundary: test only; runs on the commerce IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0131 (decision 4: gen records the deprecation in the manifest);
 *                     STA-2836.
 */
import { describe, expect, it } from "@stackra/testing";

import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { DEPRECATED_COMMERCE_IR } from "#core/__tests__/fixtures/deprecated-commerce-ir.fixture";
import { buildManifest } from "#core/functions/build-manifest.function";
import { deprecationsOf } from "#core/functions/deprecations-of.function";

describe(deprecationsOf, () => {
  it("lists each deprecated class, field and trait, sorted, with the identities it is given", () => {
    expect(
      deprecationsOf(
        DEPRECATED_COMMERCE_IR,
        new Map([["CancelOrderAction", "orders.order.cancel@1"]]),
      ),
    ).toEqual([
      {
        kind: "action",
        name: "CancelOrderAction",
        module: "orders",
        identity: "orders.order.cancel@1",
        since: "1.2.0",
        sunset: "2.0.0",
        replacement: "orders.order.cancel@2",
      },
      {
        kind: "trait",
        name: "Discontinued",
        module: "orders",
        identity: "discontinued",
        since: "1.2.0",
        sunset: "2.0.0",
        replacement: "Archivable",
      },
      {
        kind: "integration_event",
        name: "OrderPaid",
        module: "orders",
        since: "1.2.0",
        sunset: "2.0.0",
      },
      {
        kind: "field",
        name: "OrderView",
        member: "note",
        module: "orders",
        since: "2026-11-26",
        sunset: "2027-05-26",
        replacement: "OrderView.remarks",
      },
    ]);
  });

  it("names a settings group's field a setting", () => {
    const settings = {
      ...COMMERCE_IR,
      shapes: [
        {
          name: "OrderSettings",
          kind: "settings",
          module: "orders",
          file: "src/modules/orders/settings/order.settings.ts",
          importPath: "#modules/orders/settings/order.settings",
          fields: [
            {
              name: "autoCancel",
              optional: false,
              nullable: false,
              type: { kind: "boolean" as const },
              rules: [],
              deprecated: { since: "1.2.0", sunset: "2.0.0" },
            },
          ],
          relations: [],
        },
      ],
    };
    expect(deprecationsOf(settings, new Map())).toEqual([
      {
        kind: "setting",
        name: "OrderSettings",
        member: "autoCancel",
        module: "orders",
        since: "1.2.0",
        sunset: "2.0.0",
      },
    ]);
  });

  it("is empty, and the manifest has no section, when nothing is deprecated", () => {
    expect(deprecationsOf(COMMERCE_IR, new Map())).toEqual([]);
    expect(buildManifest(COMMERCE_IR).manifest).not.toHaveProperty("deprecations");
  });

  it("records the section, the action's and event's terms and the field's schema mark in the manifest", () => {
    const { manifest, errors } = buildManifest(DEPRECATED_COMMERCE_IR);
    expect(errors).toEqual([]);
    expect(manifest.deprecations?.map((entry) => [entry.kind, entry.name, entry.identity])).toEqual(
      [
        ["action", "CancelOrderAction", "orders.order.cancel@1"],
        ["trait", "Discontinued", "discontinued"],
        ["integration_event", "OrderPaid", "orders.order.paid.v1"],
        ["field", "OrderView", undefined],
      ],
    );
    expect(
      manifest.actions?.find((entry) => entry.class === "CancelOrderAction")?.["deprecated"],
    ).toEqual({
      since: "1.2.0",
      sunset: "2.0.0",
      replacement: "orders.order.cancel@2",
    });
    expect(manifest.events?.find((entry) => entry.class === "OrderPaid")?.["deprecated"]).toEqual({
      since: "1.2.0",
      sunset: "2.0.0",
    });
    expect(manifest.actions?.find((entry) => entry.class === "ListOrdersQuery")).not.toHaveProperty(
      "deprecated",
    );
    const view = (manifest.schemas as Record<string, { properties: Record<string, unknown> }>)[
      "orders.OrderView"
    ];
    expect(view?.properties["note"]).toMatchObject({
      type: "string",
      deprecated: true,
      "x-stackra-sunset": "2027-05-26",
    });
    expect(view?.properties["total"]).not.toHaveProperty("deprecated");
  });
});
