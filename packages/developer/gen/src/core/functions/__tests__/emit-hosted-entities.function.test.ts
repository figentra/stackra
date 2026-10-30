/**
 * Stackra file contract:
 * Purpose: unit tests of `emitHostedEntities` and the `entity` facts `buildManifest` records: a service hosting a
 *          package writes that package's EntitySchema from its manifest, the same properties the package writes
 *          itself, over the class the package's entry exports; the registrations load that file instead of a
 *          `<MODULE>_ENTITIES` import; a package whose manifest records no facts keeps the import; no file outside a
 *          service.
 * Boundary: test only; runs on the IR fixtures and the manifests `buildManifest` derives from them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0097 (decision 5.4); STA-1667.
 */
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { emitEntities } from "#core/functions/emit-entities.function";
import { emitHostedEntities } from "#core/functions/emit-hosted-entities.function";
import { emitRegistrations } from "#core/functions/emit-registrations.function";
import type { MemberIR } from "#core/types/member-ir.type";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";

/** The commerce fixture as a package the billing service hosts, through the manifest gen builds for it. */
const KIT = { ...buildManifest(COMMERCE_IR).manifest, package: "@acme/commerce-kit" };

/** The billing service hosting it. */
const HOST: MemberIR = {
  ...BILLING_IR,
  dependencies: [...BILLING_IR.dependencies, { package: "@acme/commerce-kit", manifest: KIT }],
};

/** The `properties` block of the `EntitySchema` of `model` in an entity file. */
function propertiesOf(content: string, model: string): string {
  const start = content.indexOf(`export const ${model}Schema`);
  return content.slice(content.indexOf("  properties: {", start), content.indexOf("\n});", start));
}

describe("emitHostedEntities", () => {
  const files = emitHostedEntities(HOST);
  const orders = files.find((file) => file.path.endsWith("/orders.ts"))?.content ?? "";

  it("records each model's entity facts in the manifest", () => {
    const order = KIT.models?.find((model) => model["class"] === "Order");
    expect(order?.["entity"]).toMatchObject({ module: "orders", relations: [], computed: [] });
  });

  it("writes the hosted package's entities into the service, one file per module", () => {
    expect(files.map((file) => file.path)).toEqual([
      ".stackra/gen/entities/hosted/commerce/orders.ts",
    ]);
    expect(orders).toContain("export const ORDERS_ENTITIES");
    expect(orders).toContain("registerEntities(ORDERS_ENTITIES);");
  });

  it("imports the model from the package's entry, not the package's source", () => {
    expect(orders).toContain('import { Order } from "@acme/commerce-kit/node";');
    expect(orders).not.toContain("#modules/");
  });

  it("writes the same EntitySchema properties as the package writes for itself", () => {
    expect(propertiesOf(orders, "Order")).toBe(
      propertiesOf(emitEntities(COMMERCE_IR, "orders") ?? "", "Order"),
    );
  });

  it("makes the registrations load the file instead of importing ORDERS_ENTITIES", () => {
    const registrations = emitRegistrations(HOST, buildManifest(HOST).manifest) ?? "";
    expect(registrations).toContain('import "#stackra/entities/hosted/commerce/orders";');
    expect(registrations).not.toContain("COMMERCE_ENTITIES");
    // `@stackra/segments`' fixture manifest records no facts, so it keeps its import.
    expect(registrations).toContain("registerEntities([...SEGMENTS_ENTITIES]);");
  });

  it("writes nothing outside a service", () => {
    expect(
      emitHostedEntities({
        ...LOYALTY_KIT_IR,
        dependencies: [{ package: "@acme/commerce-kit", manifest: KIT }],
      }),
    ).toEqual([]);
  });
});
