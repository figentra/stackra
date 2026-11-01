/**
 * Stackra file contract:
 * Purpose: unit tests of `checkApproval`: one passing declaration and one failing fixture per refusal
 *          (`approval_not_constant`, `approval_on_query`, `approval_window_too_long`, `approval_actor_not_allowed`,
 *          `approval_credential_input`, `approval_condition_dependency`, `approval_condition_reads_unmarked`).
 * Boundary: test only; runs on the commerce IR fixture with hand-added classes and shapes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0509; STA-1724 FR-002 and FR-003.
 */
import { describe, expect, it } from "@stackra/testing";

import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { checkApproval } from "#core/functions/check-approval.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";

const ACTION = COMMERCE_IR.classes.find((c) => c.kind === "action") as DeclaredClass;
const QUERY = COMMERCE_IR.classes.find((c) => c.kind === "query") as DeclaredClass;

const OK = { permission: { $class: "CouponPermissions", from: "x", member: "approve" } };

/** A declared class of the orders module. */
const klass = (name: string, kind: string, extra: Partial<DeclaredClass>): DeclaredClass => ({
  name,
  kind,
  module: "orders",
  file: `src/modules/orders/access/${name}.ts`,
  importPath: `#modules/orders/access/${name}`,
  options: {},
  deps: [],
  facets: [],
  methods: [],
  refusals: [],
  statics: {},
  traits: [],
  ...extra,
});

const SETTINGS: ShapeIR = {
  name: "OrdersSettings",
  kind: "settings",
  module: "orders",
  file: "src/modules/orders/orders.settings.ts",
  importPath: "#modules/orders/orders.settings",
  fields: [
    { name: "maxPercent", optional: false, nullable: false, type: { kind: "number" }, rules: [] },
    { name: "label", optional: false, nullable: false, type: { kind: "string" }, rules: [] },
  ],
  relations: [],
};

const setting = (member: string, options: unknown): DeclaredClass["facets"][number] => ({
  name: "Setting",
  kind: "setting",
  target: "field",
  member,
  options,
  from: "@stackra/settings",
});

/** The fixture plus `extra` classes, its action's options changed by `options`, and optional `shapes`. */
function ir(
  options: Record<string, unknown>,
  extra: readonly DeclaredClass[] = [],
  shapes: readonly ShapeIR[] = [],
): MemberIR {
  return {
    ...COMMERCE_IR,
    classes: [
      ...COMMERCE_IR.classes.map((c) =>
        c === ACTION ? { ...c, options: { ...c.options, ...options } } : c,
      ),
      klass("OrdersSettings", "settings", {
        facets: [setting("maxPercent", { approval: true }), setting("label", {})],
      }),
      ...extra,
    ],
    shapes: [...COMMERCE_IR.shapes, SETTINGS, ...shapes],
  };
}

const codes = (member: MemberIR): string[] => checkApproval(member).map((error) => error.code);
const condition = (extra: Partial<DeclaredClass>): DeclaredClass =>
  klass("AboveCondition", "approval_condition", extra);

describe("checkApproval", () => {
  it("passes a declared stage, a marked read and a condition with no dependency", () => {
    expect(codes(ir({ approval: true }))).toEqual([]);
    expect(
      codes(ir({ approval: { ...OK, expiresAfter: "720h" }, actors: ["user", "external_agent"] })),
    ).toEqual([]);
    expect(
      codes(ir({}, [condition({ statics: { reads: '["orders.maxPercent"] as const' } })])),
    ).toEqual([]);
  });

  it("refuses an approval option gen cannot read", () => {
    expect(codes(ir({ approvalNotConstant: true }))).toEqual(["approval_not_constant"]);
  });

  it("refuses approval on a query", () => {
    const member = ir({});
    const withQuery: MemberIR = {
      ...member,
      classes: member.classes.map((c) =>
        c === QUERY ? { ...c, options: { ...c.options, approval: true } } : c,
      ),
    };
    expect(codes(withQuery)).toEqual(["approval_on_query"]);
  });

  it("refuses an expiresAfter above 30 days", () => {
    expect(codes(ir({ approval: { ...OK, expiresAfter: "721h" } }))).toEqual([
      "approval_window_too_long",
    ]);
  });

  it("refuses an actor kind outside the allow-list, and actors that are not constant", () => {
    expect(codes(ir({ approval: true, actors: ["user", "service"] }))).toEqual([
      "approval_actor_not_allowed",
    ]);
    expect(codes(ir({ approval: true, actors: undefined }))).toEqual([
      "approval_actor_not_allowed",
    ]);
  });

  it("refuses approval on an action with a credential input field", () => {
    const input = COMMERCE_IR.shapes.find((s) => s.name === ACTION.handle?.input) as ShapeIR;
    const member = ir({ approval: true });
    const withSecret: MemberIR = {
      ...member,
      shapes: member.shapes.map((s) =>
        s === input
          ? {
              ...s,
              fields: [
                ...s.fields,
                {
                  name: "apiKey",
                  optional: false,
                  nullable: false,
                  type: { kind: "string" },
                  rules: [],
                  classified: "credential",
                },
              ],
            }
          : s,
      ),
    };
    expect(codes(withSecret)).toEqual(["approval_credential_input"]);
  });

  it("refuses any constructor dependency of a condition", () => {
    const dep = { class: { name: "OrderService", from: "#modules/orders/services/order.service" } };
    expect(codes(ir({}, [condition({ deps: [dep] })]))).toEqual(["approval_condition_dependency"]);
  });

  it("refuses a read of a key not marked approval, or not declared", () => {
    expect(codes(ir({}, [condition({ statics: { reads: '["orders.label"]' } })]))).toEqual([
      "approval_condition_reads_unmarked",
    ]);
    expect(codes(ir({}, [condition({ statics: { reads: '["billing.unknown"]' } })]))).toEqual([
      "approval_condition_reads_unmarked",
    ]);
  });
});
