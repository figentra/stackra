/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncoreApi`: a service gets `.stackra/encore/<member>/api.ts` with one `api()` per own
 *          action and query that has an endpoint, named by its camel-cased key and version, with the entry's method and
 *          path, typed by its input and output schemas, running `new ActionPipeline(container).execute(...)` inside
 *          `app.handlers.run` with the actor from `getAuthData()`; an anonymous entry is `auth: false` and falls back
 *          to an anonymous actor; an entry with no endpoint, a hosted entry and one whose input or output schema the
 *          member does not declare get no adapter; a shape named like a bound name or another module's shape is
 *          aliased; a package, an app and a service with no such entry get no file.
 * Boundary: test only; runs on the commerce IR fixture and the manifest `buildManifest` derives from it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 21); ADR 0098; STA-2025; STA-2063 (FR-002 to
 *                     FR-006).
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { emitEncoreApi } from "#core/functions/emit-encore-api.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

/** The entry import of a generated .stackra/encore/<service>/ file; a constant so validate does not read it as this test's own import. */
const GENERATED_ENTRY = "../../entry/server";

/** A query of the commerce module, without input or output. */
function query(name: string, stem: string, options: Record<string, unknown>): DeclaredClass {
  return {
    name,
    kind: "query",
    module: "orders",
    file: `src/modules/orders/queries/${stem}.query.ts`,
    importPath: `#modules/orders/queries/${stem}.query`,
    options,
    deps: [],
    facets: [],
    methods: ["handle"],
    refusals: [],
    statics: {},
    traits: [],
  };
}

/** A schema shape without fields. */
function shape(name: string, module: string, stem: string): ShapeIR {
  const file = `src/modules/${module}/schemas/${stem}.schema.ts`;
  return {
    name,
    kind: "schema",
    module,
    file,
    importPath: `#modules/${module}/schemas/${stem}.schema`,
    fields: [],
    relations: [],
  };
}

describe(emitEncoreApi, () => {
  const ir: MemberIR = {
    ...COMMERCE_IR,
    classes: [
      ...COMMERCE_IR.classes,
      query("CheckHealthQuery", "check-health", {
        key: "health.check",
        actors: ["anonymous", "user"],
      }),
      query("CountOrdersQuery", "count-orders", { key: "order.count", endpoint: false }),
    ],
    shapes: [
      ...COMMERCE_IR.shapes,
      // Names the file binds itself, or another module's shape already took.
      shape("ActionPipeline", "orders", "action-pipeline"),
      shape("Summary", "orders", "summary"),
      shape("Summary", "billing", "summary"),
    ],
  };
  const built = buildManifest(ir).manifest;
  const entries = built.actions ?? [];
  type Entry = (typeof entries)[number];
  // Both are in `ir`, so the lookups always find them; the casts keep the spreads below complete.
  const cancel = entries.find((entry) => entry.key === "orders.order.cancel@1") as Entry;
  const list = entries.find((entry) => entry.key === "orders.order.list@1") as Entry;
  const manifest: StackraManifest = {
    ...built,
    actions: [
      ...entries,
      // A hosted package's entry: its schemas' files are not known, so it gets no adapter yet.
      { ...cancel, key: "kit.order.cancel@1", from: "@acme/kit" },
      // A schema the member does not declare, as input and as output.
      { ...cancel, key: "orders.order.void@1", input: { $ref: "#/schemas/orders.VoidOrderInput" } },
      {
        ...cancel,
        key: "orders.order.refund@1",
        output: { $ref: "#/schemas/orders.RefundOrderOutput" },
      },
      // Shapes whose names clash with a bound name and with each other.
      {
        ...list,
        key: "orders.order.pipeline@1",
        output: { $ref: "#/schemas/orders.ActionPipeline" },
      },
      {
        ...list,
        key: "orders.order.summary@1",
        input: { $ref: "#/schemas/orders.Summary" },
        output: { $ref: "#/schemas/billing.Summary" },
      },
    ] as NonNullable<StackraManifest["actions"]>,
  };
  const content = emitEncoreApi(ir, manifest)?.content ?? "";
  const endpoint = (
    entry: (typeof entries)[number] | undefined,
  ): { method: string; path: string } => entry?.["endpoint"] as { method: string; path: string };

  it("writes the endpoints file of a service, importing the pipeline, Encore and the server app", () => {
    expect(emitEncoreApi(ir, manifest)?.path).toBe(".stackra/encore/commerce/api.ts");
    for (const line of [
      'import { ActionPipeline } from "@stackra/actions";',
      'import { ActorKind, mintPublicId } from "@stackra/contracts";',
      'import { api } from "encore.dev/api";',
      'import { getAuthData } from "~encore/auth";',
      'import { CancelOrderAction } from "#modules/orders/actions/cancel-order.action";',
      'import type { CancelOrderInput } from "#modules/orders/schemas/cancel-order-input.schema";',
      `import { app } from "${GENERATED_ENTRY}";`,
    ])
      expect(content).toContain(line);
  });

  it("writes one adapter per action with the derived endpoint, run through the pipeline with the verified actor", () => {
    const { method, path } = endpoint(cancel);
    expect(content).toContain(
      [
        `/** ${method} ${path}: orders.order.cancel@1 through the action pipeline. */`,
        "export const ordersOrderCancelV1 = api(",
        `  { method: "${method}", path: "${path}", expose: true, auth: true },`,
        "  (input: CancelOrderInput): Promise<CancelOrderOutput> =>",
        "    app.handlers.run((container) =>",
        "      new ActionPipeline(container).execute(CancelOrderAction, input, {",
        "        actor: getAuthData()!.actor,",
        "      }),",
        "    ),",
        ");",
      ].join("\n"),
    );
  });

  it("writes a query's adapter like an action's", () => {
    const { method, path } = endpoint(list);
    expect(method).toBe("GET");
    expect(content).toContain("export const ordersOrderListV1 = api(");
    expect(content).toContain(`  { method: "GET", path: "${path}", expose: true, auth: true },`);
    expect(content).toContain("  (input: ListOrdersInput): Promise<ListOrdersOutput> =>");
    expect(content).toContain(
      "      new ActionPipeline(container).execute(ListOrdersQuery, input, {",
    );
  });

  it("opens an anonymous entry and falls back to an anonymous actor; no input or output takes none", () => {
    const { path } = endpoint(entries.find((entry) => entry.key === "orders.health.check@1"));
    expect(path).not.toContain(":");
    expect(content).toContain(
      [
        "export const ordersHealthCheckV1 = api(",
        `  { method: "GET", path: "${path}", expose: true, auth: false },`,
        "  (): Promise<void> =>",
        "    app.handlers.run((container) =>",
        "      new ActionPipeline(container).execute(CheckHealthQuery, {}, {",
        '        actor: getAuthData()?.actor ?? { kind: ActorKind.Anonymous, id: mintPublicId("anon") },',
        "      }),",
        "    ),",
        ");",
      ].join("\n"),
    );
    // Only the anonymous entry may run without a session.
    expect(content.match(/auth: false/g)).toHaveLength(1);
    expect(content.match(/getAuthData\(\)!\.actor/g)).toHaveLength(4);
  });

  it("writes no adapter for an entry without an endpoint, a hosted entry or an undeclared schema", () => {
    expect(content).not.toContain("CountOrdersQuery");
    expect(content).not.toContain("kitOrderCancelV1");
    expect(content).not.toContain("ordersOrderVoidV1");
    expect(content).not.toContain("ordersOrderRefundV1");
    expect(content).not.toContain("RefundOrderOutput");
    expect(content.match(/= api\(/g)).toHaveLength(5);
  });

  it("aliases a shape named like a bound name, or like another module's shape", () => {
    for (const line of [
      'import { ActionPipeline } from "@stackra/actions";',
      'import type { ActionPipeline as ActionPipeline2 } from "#modules/orders/schemas/action-pipeline.schema";',
      'import type { Summary } from "#modules/orders/schemas/summary.schema";',
      'import type { Summary as Summary2 } from "#modules/billing/schemas/summary.schema";',
      "  (input: ListOrdersInput): Promise<ActionPipeline2> =>",
      "  (input: Summary): Promise<Summary2> =>",
    ])
      expect(content).toContain(line);
    // The pipeline the adapters run is still the bound one.
    expect(content).not.toContain("new ActionPipeline2(");
  });

  it("imports the anonymous actor helpers only when an entry is anonymous", () => {
    const closed = emitEncoreApi(COMMERCE_IR, buildManifest(COMMERCE_IR).manifest)?.content;
    expect(closed).not.toContain("@stackra/contracts");
    expect(closed).not.toContain("auth: false");
  });

  it("writes none for a package, an app or a service with no endpoint", () => {
    expect(emitEncoreApi({ ...ir, layout: "package" }, manifest)).toBeUndefined();
    expect(emitEncoreApi({ ...ir, layout: "app" }, manifest)).toBeUndefined();
    expect(emitEncoreApi(ir, { ...manifest, actions: [] })).toBeUndefined();
  });
});
