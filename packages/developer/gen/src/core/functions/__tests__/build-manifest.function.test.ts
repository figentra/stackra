/**
 * Stackra file contract:
 * Purpose: unit tests of `buildManifest`: every derived identity (permissions with risks, event wire names with their
 *          broadcast, refusal codes with categories, action and query keys with endpoints, tools and refusals, model
 *          keys and tables, driver port keys and selectors, integration keys with their connection and webhook path,
 *          sequence keys, an app's block and route keys), the module graph, the facets, the schemas without a
 *          config's schema, merged package sections marked `from`, and the checks `identity_collision`,
 *          `override_duplicate`, `permission_unknown`, `identity_missing`, `prefix_invalid`, `prefix_taken` and
 *          `prefix_duplicate`; `event_name_prefixed` (STA-1255); the v3 tool default with `tool_reason_missing`, the public flag with `public_without_endpoint`, effect tags with `effect_unknown`,
 *          Integration roles and listing with `integration_role_unknown`, the `@Replaces` section, and a replica
 *          query's `ReplicaPage` output schema (ADR 0338); a package's drivers with each candidate's class, entry and
 *          tokens and the selecting config class (STA-1297); a package's `config` section (STA-1308); the `agents`,
 *          `passes` and `entitlements` sections with derived entitlement keys and gates (STA-903).
 * Boundary: test only; runs on the commerce IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 10, 20, 21 and 22); ADR 0305 (rules 1, 28 and
 *                     34); ADR 0140; ADR 0141; ADR 0135 (rule 2); ADR 0308 (rules 19 and 21); ADR 0342 (decision 1);
 *                     ADR 0360 (decisions 4 and 10); ADR 0099 (decisions 2 and 3); ADR 0355 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { MANIFEST_NOTICE } from "#core/constants/manifest-notice.constant";
import { buildManifest } from "#core/functions/build-manifest.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

/** The fixture class named `name`. */
function declared(name: string): DeclaredClass {
  const found = COMMERCE_IR.classes.find((candidate) => candidate.name === name);
  if (found === undefined) throw new Error(`no fixture class ${name}`);
  return found;
}

/** The billing service with its Stripe Integration calling `baseUrl`. */
function withBase(baseUrl: string): MemberIR {
  return {
    ...BILLING_IR,
    classes: BILLING_IR.classes.map((candidate) =>
      candidate.name === "StripeIntegration"
        ? { ...candidate, options: { ...candidate.options, baseUrl } }
        : candidate,
    ),
  };
}

describe("buildManifest", () => {
  const { manifest, errors } = buildManifest(COMMERCE_IR);

  it("derives the header, permissions and events", () => {
    expect(errors).toEqual([]);
    expect(manifest.$comment).toBe(MANIFEST_NOTICE);
    expect(manifest.member).toBe("commerce");
    expect(manifest.permissions).toEqual([
      { key: "orders.order.read", risk: "L0", class: "OrderPermissions" },
      { key: "orders.order.create", risk: "L1", class: "OrderPermissions" },
      { key: "orders.order.cancel", risk: "L2", class: "OrderPermissions" },
    ]);
    expect(manifest.events).toEqual([
      {
        name: "orders.order.paid.v1",
        module: "orders",
        class: "OrderPaid",
        file: "src/modules/orders/events/order-paid.event.ts",
        kind: "integration",
        version: 1,
        broadcast: { permission: "orders.order.read", audience: "tenant" },
        fields: { $ref: "#/schemas/orders.OrderPaid" },
      },
    ]);
  });

  it("derives refusals, actions and queries", () => {
    expect(manifest.errors).toEqual([
      {
        code: "order_not_cancellable",
        kind: "failed_precondition",
        category: "precondition_failed",
        module: "orders",
        class: "OrderNotCancellableError",
      },
    ]);
    const [cancel, list] = manifest.actions ?? [];
    expect(cancel).toMatchObject({
      key: "orders.order.cancel@1",
      kind: "action",
      permission: "orders.order.cancel",
      risk: "L2",
      actors: ["user", "agent"],
      idempotency: { ttl: "PT24H" },
      endpoint: { method: "PUT", path: "/orders/:orderId/cancel", derived: true },
      input: { $ref: "#/schemas/orders.CancelOrderInput" },
      output: { $ref: "#/schemas/orders.CancelOrderOutput" },
      refusals: ["order_not_cancellable"],
    });
    // ADR 0360 d4: an action a user can perform is a tool by default.
    expect(cancel?.["tool"]).toEqual({
      name: "orders_order_cancel",
      default: true,
      hints: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    });
    expect(list).toMatchObject({
      key: "orders.order.list@1",
      permission: "orders.order.read",
      risk: "L0",
      endpoint: { method: "GET", path: "/orders" },
      tool: { name: "orders_order_list", default: true },
    });
  });

  it("derives models, drivers, modules and facets", () => {
    expect(manifest.models).toEqual([
      {
        key: "orders.order",
        class: "Order",
        file: "src/modules/orders/models/order.model.ts",
        table: "orders.orders",
        publicId: "ord",
        traits: ["HasPublicId", "Timestamps"],
      },
    ]);
    expect(manifest.drivers).toEqual([
      {
        port: "PaymentGateway",
        key: "commerce.PaymentGateway",
        candidates: ["stripe"],
        selectedBy: "config:commerce.gateway",
      },
    ]);
    expect(manifest.modules).toEqual([
      { key: "commerce", class: "CommerceModule", exports: [], dependsOn: [] },
      { key: "orders", exports: [], dependsOn: ["commerce"] },
    ]);
    expect(manifest["facets"]).toEqual([
      {
        name: "Audited",
        kind: "audited",
        target: "class",
        from: "#modules/orders/functions/audited.function",
        targets: ["OrderService.cancel", "OrderService.list"],
      },
    ]);
  });

  it("records wire schemas and never a config's schema", () => {
    const schemas = manifest.schemas as Record<string, unknown>;
    expect(Object.keys(schemas)).toContain("orders.OrderStatus");
    expect(Object.keys(schemas)).toContain("orders.CancelOrderInput");
    expect(Object.keys(schemas)).not.toContain("commerce.CommerceOptions");
  });

  it("answers a replica query with the ReplicaPage schema (ADR 0338)", () => {
    const ir: MemberIR = {
      ...COMMERCE_IR,
      classes: COMMERCE_IR.classes.map((candidate) =>
        candidate.name === "ListOrdersQuery"
          ? { ...candidate, handle: { input: "ListOrdersInput", replica: true } }
          : candidate,
      ),
    };
    const built = buildManifest(ir);
    const list = built.manifest.actions?.find((entry) => entry.class === "ListOrdersQuery");
    expect(list?.["output"]).toEqual({ $ref: "#/schemas/orders.ReplicaPage" });
    expect((built.manifest.schemas as Record<string, unknown>)["orders.ReplicaPage"]).toMatchObject(
      {
        type: "object",
        required: ["rows", "removed", "cursor", "asOf", "full"],
      },
    );
    expect(built.errors).toEqual(errors);
  });

  it("merges a hosted package's sections with `from`", () => {
    const ir: MemberIR = {
      ...COMMERCE_IR,
      dependencies: [
        {
          package: "@acme/loyalty-kit",
          manifest: {
            member: "loyalty_kit",
            package: "@acme/loyalty-kit",
            version: "0.4.0",
            permissions: [{ key: "loyalty_kit.loyalty_account.redeem", risk: "L1" }],
            actions: [
              {
                key: "loyalty_kit.loyalty_account.redeem@1",
                kind: "action",
                module: "loyalty_kit",
                class: "RedeemPointsAction",
                permission: "loyalty_kit.loyalty_account.redeem",
                risk: "L1",
                input: { $ref: "#/schemas/loyalty_kit.RedeemPointsInput" },
              },
            ],
          },
        },
      ],
    };
    const merged = buildManifest(ir).manifest;
    expect(merged.actions?.at(-1)).toMatchObject({
      key: "loyalty_kit.loyalty_account.redeem@1",
      from: "@acme/loyalty-kit",
      input: { $ref: "@acme/loyalty-kit#/schemas/loyalty_kit.RedeemPointsInput" },
    });
    expect(merged.permissions?.at(-1)).toMatchObject({
      key: "loyalty_kit.loyalty_account.redeem",
      from: "@acme/loyalty-kit",
    });
  });

  it("derives integration, sequence, searchable and job identities", () => {
    const billing = buildManifest(BILLING_IR);
    expect(billing.errors).toEqual([]);
    expect(billing.manifest["integrations"]).toEqual([
      {
        key: "billing.stripe",
        class: "StripeIntegration",
        module: "billing",
        file: "src/modules/billing/integrations/stripe.integration.ts",
        connection: "StripeConnection",
        connectionFile: "src/modules/billing/connections/stripe.connection.ts",
        webhookPath: "/webhooks/billing/stripe/:connectionId",
        roles: ["webhooks"],
      },
    ]);
    expect(billing.manifest["sequences"]).toEqual([
      {
        key: "billing.invoice",
        class: "InvoiceSequence",
        module: "billing",
        file: "src/modules/billing/database/sequences/invoice.sequence.ts",
      },
      {
        key: "segments.export",
        class: "SegmentExportSequence",
        module: "segments",
        file: "src/node/database/sequences/segment-export.sequence.ts",
        from: "@stackra/segments",
      },
    ]);
    expect(billing.manifest.models?.find((model) => model.key === "billing.invoice")).toMatchObject(
      {
        publicId: "inv",
        searchable: true,
      },
    );
    expect(billing.manifest.actions?.[0]).toMatchObject({
      key: "billing.invoice.send_reminders@1",
      job: { queue: "default", cron: { schedule: "0 9 * * *" } },
    });
    expect(billing.manifest.events?.[0]).toMatchObject({
      name: "billing.invoice.issued.v2",
      version: 2,
      webhook: true,
    });
  });

  it("refuses an event name that repeats the module or member key (event_name_prefixed, STA-1255)", () => {
    const paid = declared("OrderPaid");
    const named = (name: string, written: string): DeclaredClass => ({
      ...paid,
      name,
      options: { ...paid.options, name: written },
    });
    const { errors: prefixed } = buildManifest({
      ...COMMERCE_IR,
      classes: [
        ...COMMERCE_IR.classes.filter((candidate) => candidate !== paid),
        named("OrderPaid", "orders.order.paid"),
        named("OrderShipped", "commerce.order.shipped"),
        named("OrderPacked", "order.packed"),
      ],
    });
    expect(
      prefixed
        .filter((error) => error.code === "event_name_prefixed")
        .map((error) => [error.subject, error.fix.split("`")[1]]),
    ).toEqual([
      ["OrderPaid", 'name: "order.paid"'],
      ["OrderShipped", 'name: "order.shipped"'],
    ]);
  });

  it("derives an app's block and route keys, and no such section elsewhere", () => {
    const { manifest: app, errors: appErrors } = buildManifest(WEB_APP_IR);
    expect(appErrors).toEqual([]);
    expect(app["blocks"]).toEqual([
      {
        key: "web.cta_banner",
        class: "CtaBannerBlock",
        module: "web",
        file: "src/blocks/cta-banner/cta-banner.block.ts",
      },
    ]);
    expect(app["routes"]).toEqual([
      {
        key: "order_detail",
        class: "OrderDetailRoute",
        file: "src/routes/order-detail/order-detail.route.ts",
      },
      { key: "settings", class: "SettingsRoute", file: "src/routes/settings/settings.route.ts" },
    ]);
    expect(manifest["blocks"]).toBeUndefined();
    expect(manifest["routes"]).toBeUndefined();
  });

  it("checks public id prefixes against each other and the registry", () => {
    const order = declared("Order");
    const withPrefix = (name: string, prefix: string): DeclaredClass => ({
      ...order,
      name,
      file: `src/modules/orders/models/${name.toLowerCase()}.model.ts`,
      traits: [{ name: "HasPublicId", args: [prefix] }],
    });
    const ir: MemberIR = {
      ...COMMERCE_IR,
      classes: [
        ...COMMERCE_IR.classes,
        withPrefix("Receipt", "ord"),
        withPrefix("Ticket", "Tk"),
        withPrefix("Segment", "seg"),
      ],
    };
    const codes = buildManifest(ir).errors.map((error) => `${error.code} ${error.subject}`);
    expect(codes).toContain("prefix_duplicate Receipt");
    expect(codes).toContain("prefix_invalid Ticket");
    expect(codes).toContain("prefix_taken Segment");
    const hosted: MemberIR = {
      ...COMMERCE_IR,
      dependencies: [
        {
          package: "@acme/shipping",
          manifest: {
            member: "shipping",
            package: "@acme/shipping",
            version: "1.0.0",
            models: [
              { key: "shipping.order", table: "shipping.orders", publicId: "ord", traits: [] },
            ],
          },
        },
      ],
    };
    expect(buildManifest(hosted).errors).toMatchObject([
      { code: "prefix_duplicate", subject: "@acme/shipping" },
    ]);
  });

  it("refuses a sequence without a written key", () => {
    const ir: MemberIR = {
      ...BILLING_IR,
      classes: BILLING_IR.classes.map((candidate) =>
        candidate.name === "InvoiceSequence" ? { ...candidate, options: {} } : candidate,
      ),
    };
    expect(buildManifest(ir).errors.map((error) => `${error.code} ${error.subject}`)).toEqual([
      "identity_missing InvoiceSequence",
    ]);
  });

  it("refuses a sequence outside its module's database/sequences group", () => {
    const ir: MemberIR = {
      ...BILLING_IR,
      classes: BILLING_IR.classes.map((candidate) =>
        candidate.name === "InvoiceSequence"
          ? { ...candidate, file: "src/modules/billing/services/invoice.sequence.ts" }
          : candidate,
      ),
    };
    expect(buildManifest(ir).errors.map((error) => `${error.code} ${error.subject}`)).toEqual([
      "sequence_misplaced InvoiceSequence",
    ]);
  });

  it("checks each document number names a declared sequence", () => {
    const numbered = (sequence: string): MemberIR => ({
      ...BILLING_IR,
      classes: BILLING_IR.classes.map((candidate) =>
        candidate.name === "Invoice"
          ? {
              ...candidate,
              facets: [
                ...candidate.facets,
                {
                  name: "DocumentNumber",
                  kind: "document_number",
                  target: "field" as const,
                  member: "number",
                  options: { sequence },
                  from: "@stackra/model",
                },
              ],
            }
          : candidate,
      ),
    });
    expect(buildManifest(numbered("invoice")).errors).toEqual([]);
    expect(buildManifest(numbered("segments.export")).errors).toEqual([]);
    expect(
      buildManifest(numbered("receipt")).errors.map((error) => `${error.code} ${error.subject}`),
    ).toEqual(["document_number_unsequenced Invoice"]);
  });

  it("lists each declared rule outcome kind with its label and params, and refuses one without a key", () => {
    const sequence = BILLING_IR.classes.find((candidate) => candidate.name === "InvoiceSequence");
    if (sequence === undefined) throw new Error("no fixture sequence");
    const outcome = (options: Record<string, unknown>): DeclaredClass => ({
      ...sequence,
      name: "LateFee",
      kind: "rule_outcome",
      file: "src/modules/billing/rules/late-fee.outcome.ts",
      options,
    });
    const params = {
      amount: { type: "money", label: "billing::outcomes.amount", floor: "consumer.fee_cap" },
    };
    const withOutcome = (options: Record<string, unknown>): MemberIR => ({
      ...BILLING_IR,
      classes: [...BILLING_IR.classes, outcome(options)],
    });
    const listed = buildManifest(
      withOutcome({ key: "lateFee", label: "billing::outcomes.late_fee", params }),
    );
    expect(listed.errors).toEqual([]);
    expect(listed.manifest["outcomes"]).toEqual([
      {
        key: "billing.lateFee",
        class: "LateFee",
        module: "billing",
        file: "src/modules/billing/rules/late-fee.outcome.ts",
        label: "billing::outcomes.late_fee",
        params,
      },
    ]);
    expect(
      buildManifest(withOutcome({ label: "x" })).errors.map(
        (error) => `${error.code} ${error.subject}`,
      ),
    ).toEqual(["identity_missing LateFee"]);
  });

  it("lists agents, pass kinds and entitlements with their derived keys and gates (STA-903)", () => {
    const base = declared("CancelOrderAction");
    const kindClass = (
      name: string,
      kind: string,
      file: string,
      options: Record<string, unknown>,
    ): DeclaredClass => ({ ...base, name, kind, file, importPath: `#${file}`, options, deps: [] });
    const order = { $class: "Order", from: "#modules/orders/models/order.model", kind: "model" };
    const exports = { $class: "ExportsEntitlement", from: "#x", kind: "entitlement" };
    const ir: MemberIR = {
      ...COMMERCE_IR,
      classes: [
        ...COMMERCE_IR.classes.map((candidate) =>
          candidate.name === "ListOrdersQuery"
            ? { ...candidate, options: { ...candidate.options, entitlement: exports } }
            : candidate,
        ),
        kindClass(
          "CreateOrderAction",
          "action",
          "src/modules/orders/actions/create-order.action.ts",
          {
            key: "order.create",
            actors: ["user"],
          },
        ),
        kindClass(
          "OrderLimitEntitlement",
          "entitlement",
          "src/modules/orders/access/order-limit.entitlement.ts",
          { kind: "limit", counts: order, where: { archivedAt: null } },
        ),
        kindClass(
          "ExportsEntitlement",
          "entitlement",
          "src/modules/orders/access/exports.entitlement.ts",
          { kind: "feature" },
        ),
        kindClass(
          "OrderAssistantAgent",
          "agent",
          "src/modules/orders/ai/order-assistant.agent.ts",
          {
            key: "order_assistant",
            task: "chat",
            tools: [{ $class: "ListOrdersQuery", from: "#q", kind: "query" }],
          },
        ),
        kindClass("ReceiptPass", "pass", "src/modules/orders/integrations/receipt.pass.ts", {
          key: "receipt",
        }),
      ],
    };
    const built = buildManifest(ir);
    expect(built.errors).toEqual([]);
    expect(built.manifest["entitlements"]).toEqual([
      {
        key: "orders.order_limit",
        class: "OrderLimitEntitlement",
        module: "orders",
        file: "src/modules/orders/access/order-limit.entitlement.ts",
        kind: "limit",
        counts: "orders.order",
        where: { archivedAt: null },
        gates: ["orders.order.create@1"],
      },
      {
        key: "orders.exports",
        class: "ExportsEntitlement",
        module: "orders",
        file: "src/modules/orders/access/exports.entitlement.ts",
        kind: "feature",
        gates: ["orders.order.list@1"],
      },
    ]);
    expect(built.manifest["agents"]).toEqual([
      {
        key: "order_assistant",
        class: "OrderAssistantAgent",
        module: "orders",
        file: "src/modules/orders/ai/order-assistant.agent.ts",
        task: "chat",
        tools: ["orders.order.list@1"],
      },
    ]);
    expect(built.manifest["passes"]).toEqual([
      {
        key: "receipt",
        class: "ReceiptPass",
        module: "orders",
        file: "src/modules/orders/integrations/receipt.pass.ts",
      },
    ]);
    const unkeyed = buildManifest({
      ...ir,
      classes: [
        ...COMMERCE_IR.classes,
        kindClass("BarePass", "pass", "src/modules/orders/integrations/bare.pass.ts", {}),
      ],
    });
    expect(unkeyed.errors.map((error) => `${error.code} ${error.subject}`)).toEqual([
      "identity_missing BarePass",
    ]);
  });

  it("locks an Integration's egress entry, a {field} host kept as data, and refuses a base URL it cannot call", () => {
    expect(buildManifest(withBase("https://api.stripe.com/v1")).manifest["integrations"]).toEqual([
      expect.objectContaining({ egress: { origin: "https://api.stripe.com" } }),
    ]);
    expect(
      buildManifest(withBase("https://{region}.api.stripe.com")).manifest["integrations"],
    ).toEqual([
      expect.objectContaining({
        egress: { origin: "https://{region}.api.stripe.com", fields: ["region"] },
      }),
    ]);
    expect(
      buildManifest(withBase("http://api.stripe.com")).errors.map(
        (error) => `${error.code} ${error.subject}`,
      ),
    ).toEqual(["egress_invalid StripeIntegration"]);
  });

  it("reports colliding, duplicate, unknown and missing identities", () => {
    const cancel = declared("CancelOrderAction");
    const ir: MemberIR = {
      ...COMMERCE_IR,
      classes: [
        ...COMMERCE_IR.classes,
        {
          ...cancel,
          name: "VoidOrderAction",
          file: "src/modules/orders/actions/void-order.action.ts",
        },
        { ...cancel, name: "RefundOrderAction", options: { key: "order.refund" } },
        { ...cancel, name: "NoKeyAction", options: {} },
        {
          ...declared("CommerceConfig"),
          name: "AnalyticsConfig",
          base: { name: "AnalyticsConfig", from: "@stackra/analytics", own: false },
        },
        {
          ...declared("CommerceConfig"),
          name: "OtherAnalyticsConfig",
          base: { name: "AnalyticsConfig", from: "@stackra/analytics", own: false },
        },
      ],
    };
    const codes = buildManifest(ir).errors.map((error) => `${error.code} ${error.subject}`);
    expect(codes).toContain("identity_collision VoidOrderAction");
    expect(codes).toContain("permission_unknown RefundOrderAction");
    expect(codes).toContain("identity_missing NoKeyAction");
    expect(codes).toContain("override_duplicate OtherAnalyticsConfig");
  });

  it("treats a class that only builds on a package class as no override (ADR 0305 rule 1)", () => {
    const input = declared("CommerceConfig");
    const cursor = (name: string): DeclaredClass => ({
      ...input,
      kind: "schema",
      name,
      base: { name: "CursorInput", from: "@stackra/validation", own: false },
    });
    const ir: MemberIR = {
      ...COMMERCE_IR,
      classes: [...COMMERCE_IR.classes, cursor("ListNotesInput"), cursor("ListCommentsInput")],
    };
    const codes = buildManifest(ir).errors.map((error) => error.code);
    expect(codes).not.toContain("override_duplicate");
  });

  it("gives a query its own verb only when its Permissions class declares it", () => {
    const list = declared("ListOrdersQuery");
    const permissions = declared("OrderPermissions");
    const ir: MemberIR = {
      ...COMMERCE_IR,
      classes: [
        ...COMMERCE_IR.classes.filter((item) => item.name !== permissions.name),
        { ...permissions, statics: { ...permissions.statics, search: "Permission.L1" } },
        { ...list, name: "SearchOrdersQuery", options: { ...list.options, key: "order.search" } },
        { ...list, name: "FeedOrdersQuery", options: { ...list.options, key: "order.feed" } },
      ],
    };
    const { manifest: built, errors: refused } = buildManifest(ir);
    const permissionOf = (name: string): unknown =>
      (built.actions ?? []).find((entry) => entry["class"] === name)?.["permission"];
    expect(refused.map((error) => error.code)).not.toContain("permission_unknown");
    expect(permissionOf("SearchOrdersQuery")).toBe("orders.order.search");
    expect(permissionOf("FeedOrdersQuery")).toBe("orders.order.read");
    expect(permissionOf("ListOrdersQuery")).toBe("orders.order.read");
  });

  it("lets the member named after a package host its model with the package's prefix", () => {
    const order = declared("Order");
    const account: DeclaredClass = {
      ...order,
      name: "Account",
      module: "accounts",
      file: "src/modules/accounts/models/account.model.ts",
      traits: [{ name: "HasPublicId", args: ["usr"] }],
    };
    const identity: MemberIR = { ...COMMERCE_IR, member: "identity", classes: [account] };
    const { manifest: built, errors: refused } = buildManifest(identity);
    expect(refused.map((error) => error.code)).not.toContain("prefix_taken");
    expect(built.models?.find((model) => model.key === "accounts.account")).toMatchObject({
      publicId: "usr",
      hosts: "identity.user",
    });
    const elsewhere = buildManifest({ ...identity, member: "crm" }).errors;
    expect(elsewhere.map((error) => `${error.code} ${error.subject}`)).toContain(
      "prefix_taken Account",
    );
  });

  describe("tools, effects, listings and replacements", () => {
    const cancel = declared("CancelOrderAction");
    const withClasses = (...classes: DeclaredClass[]): MemberIR => ({
      ...COMMERCE_IR,
      classes: [...COMMERCE_IR.classes.filter((item) => item.name !== cancel.name), ...classes],
    });
    const codesOf = (ir: MemberIR): string[] =>
      buildManifest(ir).errors.map((error) => `${error.code} ${error.subject}`);

    it("refuses `tool: false` on a user action without a reason, and records the reason", () => {
      const off = { ...cancel, options: { ...cancel.options, tool: false } };
      expect(codesOf(withClasses(off))).toContain("tool_reason_missing CancelOrderAction");
      const reasoned = { ...off, options: { ...off.options, toolReason: "needs a card reader" } };
      const { manifest: built, errors: found } = buildManifest(withClasses(reasoned));
      expect(found).toEqual([]);
      const entry = built.actions?.find((action) => action.class === "CancelOrderAction");
      expect(entry?.["tool"]).toBeUndefined();
      expect(entry?.["toolOff"]).toBe("needs a card reader");
    });

    it("marks a public action and refuses one with no endpoint to publish", () => {
      const published = { ...cancel, options: { ...cancel.options, public: true } };
      const { manifest: built, errors: found } = buildManifest(withClasses(published));
      expect(found).toEqual([]);
      expect(
        built.actions?.find((action) => action.class === "CancelOrderAction")?.["public"],
      ).toBe(true);
      expect(
        buildManifest(withClasses(cancel)).manifest.actions?.find(
          (action) => action.class === "CancelOrderAction",
        )?.["public"],
      ).toBeUndefined();
      const hidden = { ...published, options: { ...published.options, endpoint: false } };
      expect(codesOf(withClasses(hidden))).toContain("public_without_endpoint CancelOrderAction");
    });

    it("keeps a system-only action off the tool list without a reason", () => {
      const system = { ...cancel, options: { ...cancel.options, actors: ["system"] } };
      const { manifest: built, errors: found } = buildManifest(withClasses(system));
      expect(found).toEqual([]);
      expect(
        built.actions?.find((action) => action.class === "CancelOrderAction")?.["tool"],
      ).toBeUndefined();
    });

    it("records effect tags, derives the hints from them and refuses an unknown tag", () => {
      const tagged = {
        ...cancel,
        options: {
          ...cancel.options,
          effects: ["financial", "external_communication", "irreversible"],
        },
      };
      const entry = buildManifest(withClasses(tagged)).manifest.actions?.find(
        (action) => action.class === "CancelOrderAction",
      );
      expect(entry?.["effects"]).toEqual(["financial", "external_communication", "irreversible"]);
      expect(entry?.["tool"]).toMatchObject({
        default: true,
        hints: { destructiveHint: true, openWorldHint: true, readOnlyHint: false },
      });
      const unknown = { ...cancel, options: { ...cancel.options, effects: ["spooky"] } };
      expect(codesOf(withClasses(unknown))).toContain("effect_unknown CancelOrderAction");
    });

    it("records an Integration's roles and listing, and refuses an unknown role", () => {
      const stripe = BILLING_IR.classes.find((item) => item.name === "StripeIntegration");
      if (stripe === undefined) throw new Error("no StripeIntegration fixture");
      const listed = {
        ...stripe,
        options: {
          ...stripe.options,
          roles: ["driver", "connector"],
          listing: { entitlement: "billing.stripe" },
        },
      };
      const ir: MemberIR = {
        ...BILLING_IR,
        classes: BILLING_IR.classes.map((item) => (item === stripe ? listed : item)),
      };
      expect(buildManifest(ir).manifest["integrations"]).toEqual([
        expect.objectContaining({
          roles: ["driver", "connector", "webhooks"],
          listing: { entitlement: "billing.stripe" },
        }),
      ]);
      const wrong = { ...stripe, options: { ...stripe.options, roles: ["reseller"] } };
      const codes = buildManifest({
        ...BILLING_IR,
        classes: BILLING_IR.classes.map((item) => (item === stripe ? wrong : item)),
      }).errors.map((error) => `${error.code} ${error.subject}`);
      expect(codes).toContain("integration_role_unknown StripeIntegration");
    });

    it("lists each `@Replaces` replacement", () => {
      const service = COMMERCE_IR.classes.find((item) => item.kind === "service");
      if (service === undefined) throw new Error("no service fixture");
      const replacing = {
        ...service,
        facets: [
          ...service.facets,
          {
            name: "Replaces",
            kind: "replaces",
            target: "class" as const,
            options: { $class: "TaxService", from: "@stackra/pricing" },
            from: "@stackra/container",
          },
        ],
      };
      const ir: MemberIR = {
        ...COMMERCE_IR,
        classes: COMMERCE_IR.classes.map((item) => (item === service ? replacing : item)),
      };
      expect(buildManifest(ir).manifest["replaces"]).toEqual([
        {
          class: service.name,
          file: service.file,
          replaces: "TaxService",
          from: "@stackra/pricing",
        },
      ]);
    });
  });
});

describe("buildManifest's package drivers (STA-1297)", () => {
  it("records each candidate's class, entry and tokens, and the config class that selects one", () => {
    const ir: MemberIR = {
      ...LOYALTY_KIT_IR,
      classes: LOYALTY_KIT_IR.classes.map((candidate) =>
        candidate.name === "MemoryLoyaltyLedgerDriver"
          ? {
              ...candidate,
              deps: [
                { class: { name: "LoyaltyKitConfig", from: "#config/loyalty-kit.config" } },
                { class: { name: "Clock", from: "@stackra/contracts" } },
              ],
            }
          : candidate,
      ),
    };
    expect(buildManifest(ir).manifest.drivers).toEqual([
      {
        port: "LoyaltyLedger",
        key: "loyalty_kit.LoyaltyLedger",
        candidates: ["memory"],
        selectedBy: "config:loyalty_kit.ledger",
        classes: {
          memory: {
            class: "MemoryLoyaltyLedgerDriver",
            from: "@acme/loyalty-kit",
            deps: [
              { class: { name: "LoyaltyKitConfig", from: "@acme/loyalty-kit" } },
              { class: { name: "Clock", from: "@stackra/contracts" } },
            ],
          },
        },
        config: { class: "LoyaltyKitConfig", from: "@acme/loyalty-kit" },
      },
    ]);
  });

  it("keeps a service's drivers to names", () => {
    const [driver] = buildManifest(COMMERCE_IR).manifest.drivers ?? [];
    expect(driver).not.toHaveProperty("classes");
  });
});

describe("buildManifest's package config section (STA-1308)", () => {
  it("lists a package's config classes with their key and public entry", () => {
    expect(buildManifest(LOYALTY_KIT_IR).manifest["config"]).toEqual([
      { key: "loyalty_kit", class: "LoyaltyKitConfig", from: "@acme/loyalty-kit" },
    ]);
  });

  it("writes no config section for a service", () => {
    expect(buildManifest(COMMERCE_IR).manifest).not.toHaveProperty("config");
  });
});
