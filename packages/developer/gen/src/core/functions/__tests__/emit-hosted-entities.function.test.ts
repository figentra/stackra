/**
 * Stackra file contract:
 * Purpose: unit tests of `emitHostedEntities` and the `entity` facts `buildManifest` records: a service hosting a
 *          package writes that package's EntitySchema from its manifest, the same properties the package writes
 *          itself (less the `~defaults` marker its published types lack), over the class the package's entry exports; the registrations load that file instead of a
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

/** The billing fixture (models with relations and a link) as a package, through the manifest gen builds for it. */
const KIT = { ...buildManifest(BILLING_IR).manifest, package: "@acme/billing-kit" };

/** The commerce service hosting it. */
const HOST: MemberIR = {
  ...COMMERCE_IR,
  dependencies: [...COMMERCE_IR.dependencies, { package: "@acme/billing-kit", manifest: KIT }],
};

/** The `properties` block of the `EntitySchema` of `model` in an entity file. */
function propertiesOf(content: string, model: string): string {
  const start = content.indexOf(`export const ${model}Schema`);
  return content.slice(content.indexOf("  properties: {", start), content.indexOf("\n});", start));
}

describe("emitHostedEntities", () => {
  const files = emitHostedEntities(HOST);
  const billing = files.find((file) => file.path.endsWith("/billing.ts"))?.content ?? "";

  it("records each model's entity facts in the manifest", () => {
    const invoice = KIT.models?.find((model) => model["class"] === "Invoice");
    expect(invoice?.["entity"]).toMatchObject({ module: "billing", computed: ["isPaid"] });
  });

  it("writes the hosted package's entities into the service, one file per module", () => {
    expect(files.map((file) => file.path)).toEqual([
      ".stackra/gen/entities/hosted/billing/billing.ts",
      ".stackra/gen/entities/hosted/billing/crm.ts",
    ]);
    expect(billing).toContain("export const BILLING_ENTITIES");
    expect(billing).toContain("registerEntities(BILLING_ENTITIES);");
  });

  it("imports the models from the package's entry and re-declares no [OptionalProps]", () => {
    expect(billing).toMatch(/import \{[^}]*Invoice[^}]*\} from "@acme\/billing-kit\/node";/);
    expect(billing).not.toContain("#modules/");
    expect(billing).not.toContain("declare module");
  });

  it("writes the same EntitySchema properties as the package writes for itself, without the ~defaults marker", () => {
    // The marker types a service's own model through its schemas file; a hosted class comes from the package's
    // published types, which have no such key (TS2353).
    const own = (emitEntities(BILLING_IR, "billing") ?? "").replaceAll(
      '    "~defaults": { type: "json", persist: false },\n',
      "",
    );
    for (const model of ["Invoice", "InvoiceLine"])
      expect(propertiesOf(billing, model)).toBe(propertiesOf(own, model));
    expect(billing).not.toContain('"~defaults"');
  });

  it("makes the registrations load the files instead of importing BILLING_ENTITIES", () => {
    const registrations = emitRegistrations(HOST, buildManifest(HOST).manifest) ?? "";
    expect(registrations).toContain('import "#stackra/entities/hosted/billing/billing";');
    expect(registrations).not.toContain("BILLING_ENTITIES");
  });

  it("keeps the BILLING_ENTITIES import for a manifest that records no entity facts", () => {
    const older = {
      ...KIT,
      models: (KIT.models ?? []).map(({ entity: _entity, ...model }) => model),
    };
    const host: MemberIR = {
      ...COMMERCE_IR,
      dependencies: [
        ...COMMERCE_IR.dependencies,
        { package: "@acme/billing-kit", manifest: older },
      ],
    };
    expect(emitHostedEntities(host)).toEqual([]);
    expect(emitRegistrations(host, buildManifest(host).manifest)).toContain(
      "registerEntities([...BILLING_ENTITIES]);",
    );
  });

  it("writes nothing outside a service", () => {
    expect(
      emitHostedEntities({
        ...LOYALTY_KIT_IR,
        dependencies: [{ package: "@acme/billing-kit", manifest: KIT }],
      }),
    ).toEqual([]);
  });
});
