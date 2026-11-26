/**
 * Stackra file contract:
 * Purpose: unit tests of `checkDeprecations`: a class that injects, listens to, extends or composes something deprecated
 *          (its own, a dependency package's, a consumed service's or a contracts-only dependency's, by that manifest's
 *          `deprecations`) is warned once per thing with `deprecated_use` and the replacement in the fix; a deprecated
 *          class is not warned for its uses; an own deprecation whose sunset release the member has reached warns
 *          `deprecation_past_sunset`, a prerelease or a dated sunset does not; a clean member reports nothing; and
 *          `generateMember` returns the warnings beside its files.
 * Boundary: test only; runs on the commerce IR fixtures with classes and dependencies added per case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0131 (decision 4: gen warns on use); ADR 0177 (decision 6);
 *                     STA-340 (warnings); STA-2836.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { DEPRECATED_COMMERCE_IR } from "#core/__tests__/fixtures/deprecated-commerce-ir.fixture";
import { checkDeprecations } from "#core/functions/check-deprecations.function";
import { generateMember } from "#core/functions/generate-member.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A class of the `orders` module named `name` of `kind`, with `extra` over it. */
function declared(name: string, kind: string, extra: Partial<DeclaredClass> = {}): DeclaredClass {
  return {
    name,
    kind,
    module: "orders",
    file: `src/modules/orders/${kind}s/${name}.ts`,
    importPath: `#modules/orders/${kind}s/${name}`,
    options: {},
    deps: [],
    facets: [],
    methods: [],
    refusals: [],
    statics: {},
    traits: [],
    ...extra,
  };
}

/** A manifest of `pkg` that deprecates `entries`. */
function manifestOf(
  pkg: string,
  entries: NonNullable<StackraManifest["deprecations"]>,
): StackraManifest {
  return {
    member: pkg.split("/").pop() ?? pkg,
    package: pkg,
    version: "1.4.0",
    deprecations: entries,
  };
}

/** The listener of the deprecated `OrderPaid` event of the member itself. */
const OWN_LISTENER = declared("ShipOnPaidListener", "listener", {
  handle: { event: { name: "OrderPaid", from: "#modules/orders/events/order-paid.event" } },
});

/** The findings of `ir` as `[severity, code, subject, message]`. */
function findings(ir: MemberIR): string[][] {
  return checkDeprecations(ir).map((error) => [
    error.severity ?? "error",
    error.code,
    error.subject,
    error.message,
  ]);
}

describe(checkDeprecations, () => {
  it("reports nothing on a member that deprecates and uses nothing deprecated", () => {
    expect(checkDeprecations(COMMERCE_IR)).toEqual([]);
    expect(checkDeprecations(DEPRECATED_COMMERCE_IR)).toEqual([]);
  });

  it("warns a listener of the member's own deprecated event", () => {
    const [warning] = checkDeprecations({
      ...DEPRECATED_COMMERCE_IR,
      classes: [...DEPRECATED_COMMERCE_IR.classes, OWN_LISTENER],
    });
    expect(warning).toEqual({
      code: "deprecated_use",
      file: "src/modules/orders/listeners/ShipOnPaidListener.ts",
      line: 0,
      column: 0,
      subject: "ShipOnPaidListener",
      message:
        "ShipOnPaidListener listens to OrderPaid (an integration event of this member), deprecated since 1.2.0",
      fix: "stop using OrderPaid (an integration event of this member) before 2.0.0, when it is removed",
      severity: "warning",
    });
  });

  it("never warns a class that is deprecated itself", () => {
    const listener = { ...OWN_LISTENER, deprecated: { since: "1.2.0", sunset: "2.0.0" } };
    expect(
      checkDeprecations({
        ...DEPRECATED_COMMERCE_IR,
        classes: [...DEPRECATED_COMMERCE_IR.classes, listener],
      }),
    ).toEqual([]);
  });

  it("warns an injection of a dependency package's deprecated class, with its replacement", () => {
    const ir: MemberIR = {
      ...COMMERCE_IR,
      dependencies: [
        {
          package: "@acme/loyalty",
          manifest: manifestOf("@acme/loyalty", [
            {
              kind: "service",
              name: "PointsService",
              since: "1.3.0",
              sunset: "2.0.0",
              replacement: "LedgerService",
            },
            // A field of a class named like the injected one never matches a class use.
            { kind: "field", name: "OrderService", member: "x", since: "1.3.0", sunset: "2.0.0" },
          ]),
        },
      ],
      classes: [
        ...COMMERCE_IR.classes,
        declared("RewardService", "service", {
          deps: [
            { class: { name: "PointsService", from: "@acme/loyalty/node" } },
            { class: { name: "PointsService", from: "@acme/loyalty/node" } },
          ],
        }),
      ],
    };
    const result = checkDeprecations(ir);
    expect(result.map((warning) => [warning.code, warning.subject, warning.fix])).toEqual([
      [
        "deprecated_use",
        "RewardService",
        "use LedgerService instead of PointsService (of @acme/loyalty) before 2.0.0, when it is removed",
      ],
    ]);
  });

  it("warns a listener of a consumed service's deprecated event and a contracts-only dependency's", () => {
    const ir: MemberIR = {
      ...COMMERCE_IR,
      services: [
        {
          member: "billing",
          manifest: manifestOf("@acme/service-billing", [
            { kind: "integration_event", name: "InvoicePaid", since: "1.0.0", sunset: "2.0.0" },
          ]),
        },
      ],
      contractsDependencies: [
        {
          package: "@acme/catalogue",
          manifest: manifestOf("@acme/catalogue", [
            { kind: "port", name: "PriceSource", since: "1.0.0", sunset: "2.0.0" },
          ]),
        },
      ],
      classes: [
        ...COMMERCE_IR.classes,
        declared("CloseOnInvoicePaidListener", "listener", {
          handle: { event: { name: "InvoicePaid", from: "#stackra/clients/billing" } },
          deps: [{ class: { name: "PriceSource", from: "@acme/catalogue/contracts" } }],
        }),
      ],
    };
    expect(findings(ir).map(([, , , message]) => message)).toEqual([
      "CloseOnInvoicePaidListener injects PriceSource (of @acme/catalogue), deprecated since 1.0.0",
      "CloseOnInvoicePaidListener listens to InvoicePaid (of the billing service), deprecated since 1.0.0",
    ]);
  });

  it("warns a model composing a deprecated trait, own or a package's, and a class extending a deprecated base", () => {
    const ir: MemberIR = {
      ...DEPRECATED_COMMERCE_IR,
      dependencies: [
        {
          package: "@stackra/model",
          manifest: manifestOf("@stackra/model", [
            { kind: "trait", name: "Cached", identity: "cached", since: "1.0.0", sunset: "2.0.0" },
          ]),
        },
      ],
      classes: [
        ...DEPRECATED_COMMERCE_IR.classes,
        declared("Coupon", "model", {
          traits: [
            { name: "HasPublicId", args: ["cpn"] },
            { name: "Discontinued", args: [] },
            { name: "Cached", args: [] },
          ],
        }),
        declared("CancelOrderV2Action", "action", {
          base: {
            name: "CancelOrderAction",
            from: "#modules/orders/actions/cancel-order.action",
            own: true,
          },
        }),
      ],
    };
    expect(findings(ir).map(([, , subject, message]) => `${subject}: ${message}`)).toEqual([
      "Coupon: Coupon composes the trait Discontinued (of this member), deprecated since 1.2.0",
      "Coupon: Coupon composes the trait Cached (of @stackra/model), deprecated since 1.0.0",
      "CancelOrderV2Action: CancelOrderV2Action extends CancelOrderAction (an action of this member), deprecated since 1.2.0",
    ]);
  });

  it("warns an own deprecation whose sunset release the member has reached, never a prerelease or a date", () => {
    expect(findings({ ...DEPRECATED_COMMERCE_IR, version: "2.0.0-next.1" })).toEqual([]);
    expect(findings({ ...DEPRECATED_COMMERCE_IR, version: "2.0.0" })).toEqual([
      [
        "warning",
        "deprecation_past_sunset",
        "CancelOrderAction",
        "CancelOrderAction was deprecated in 1.2.0 to be removed at 2.0.0, and this member is at 2.0.0",
      ],
      [
        "warning",
        "deprecation_past_sunset",
        "OrderPaid",
        "OrderPaid was deprecated in 1.2.0 to be removed at 2.0.0, and this member is at 2.0.0",
      ],
      [
        "warning",
        "deprecation_past_sunset",
        "Discontinued",
        "Discontinued was deprecated in 1.2.0 to be removed at 2.0.0, and this member is at 2.0.0",
      ],
    ]);
    expect(checkDeprecations({ ...DEPRECATED_COMMERCE_IR, version: "2.1.0" })[0]?.fix).toBe(
      "remove CancelOrderAction (its users move to orders.order.cancel@2), and say so in the release note",
    );
  });

  it("reaches generateMember's warnings, which never block writing", () => {
    const result = generateMember({
      ...DEPRECATED_COMMERCE_IR,
      classes: [...DEPRECATED_COMMERCE_IR.classes, OWN_LISTENER],
    });
    expect(result.errors).toEqual([]);
    expect(result.warnings?.map((warning) => [warning.code, warning.subject])).toContainEqual([
      "deprecated_use",
      "ShipOnPaidListener",
    ]);
    expect(result.files.length).toBeGreaterThan(0);
  });
});
