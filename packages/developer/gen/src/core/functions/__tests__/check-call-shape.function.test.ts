/**
 * Stackra file contract:
 * Purpose: unit tests of `checkCallShape`: each of `query_above_l1`, `query_precondition`, `action_cache`,
 *          `step_up_missing` and `idempotency_missing` refuses its fixture beside a conforming one that passes, an
 *          unknown query risk, a service-only L3 action, an action with neither endpoint nor tool and a written
 *          `Idempotency.Optional` pass, every refusal carries a fix, and `buildManifest` reports the codes.
 * Boundary: test only; runs on the commerce IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0136 (decision 3); ADR 0207 (decision 1); ADR 0406; ADR 0294
 *                     (decision 22). @covers sta-340:FR-001 sta-340:FR-002 sta-340:FR-003 sta-340:FR-004
 *                     sta-340:FR-005 sta-340:FR-006
 */
import { describe, expect, it } from "@stackra/testing";

import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { buildManifest } from "#core/functions/build-manifest.function";
import { checkCallShape } from "#core/functions/check-call-shape.function";
import type { DeclaredClass } from "#core/types/declared-class.type";

const ACTION = COMMERCE_IR.classes.find(
  (declared) => declared.name === "CancelOrderAction",
) as DeclaredClass;
const QUERY = COMMERCE_IR.classes.find(
  (declared) => declared.name === "ListOrdersQuery",
) as DeclaredClass;

/** `declared` with its options replaced by `options`. */
const withOptions = (declared: DeclaredClass, options: Record<string, unknown>): DeclaredClass => ({
  ...declared,
  options,
});

/** The codes `checkCallShape` refuses. */
const codes = (
  declared: DeclaredClass,
  risk: string | undefined,
  routed = true,
  tool = true,
): string[] => checkCallShape(declared, { risk, routed, tool }).map((error) => error.code);

describe("checkCallShape", () => {
  it("refuses a query above L1, and passes L0, L1 and an unknown permission", () => {
    for (const risk of ["L2", "L3", "L4"]) expect(codes(QUERY, risk)).toEqual(["query_above_l1"]);
    for (const risk of ["L0", "L1", undefined]) expect(codes(QUERY, risk)).toEqual([]);
  });

  it("lets a query above L1 stand with a written reason, and refuses one without", () => {
    const reasoned = withOptions(QUERY, {
      ...QUERY.options,
      riskReason: "hands out the tenant's whole evidence",
    });
    expect(codes(reasoned, "L3")).toEqual([]);
    expect(codes(QUERY, "L2")).toEqual(["query_above_l1"]);
  });

  it("records a query's reason in the manifest", () => {
    const reason = "reads raw provider payloads";
    const built = buildManifest({
      ...COMMERCE_IR,
      classes: COMMERCE_IR.classes.map((declared) =>
        declared === QUERY
          ? withOptions(QUERY, { ...QUERY.options, riskReason: reason })
          : declared,
      ),
    });
    const entry = built.manifest.actions?.find(
      (candidate) => candidate.class === "ListOrdersQuery",
    );
    expect((entry as Record<string, unknown> | undefined)?.["riskReason"]).toBe(reason);
  });

  it("refuses a query with preconditions, and never an action", () => {
    const pre = [{ $class: "AcceptingOrdersPrecondition", from: "#p", kind: "precondition" }];
    expect(codes(withOptions(QUERY, { ...QUERY.options, preconditions: pre }), "L0")).toEqual([
      "query_precondition",
    ]);
    expect(codes(withOptions(QUERY, { ...QUERY.options, preconditions: [] }), "L0")).toEqual([]);
    expect(codes(withOptions(ACTION, { ...ACTION.options, preconditions: pre }), "L2")).toEqual([]);
  });

  it("refuses an action with cache, and never a query", () => {
    const cache = { ttl: "PT1M" };
    expect(codes(withOptions(ACTION, { ...ACTION.options, cache }), "L2")).toEqual([
      "action_cache",
    ]);
    expect(codes(withOptions(QUERY, { ...QUERY.options, cache }), "L0")).toEqual([]);
  });

  it("allows the first-factor enrolment exemption only on a listed action", () => {
    const exempt = { exempt: "first-factor-enrolment" };
    const passkey = withOptions(
      { ...ACTION, module: "identity" },
      { ...ACTION.options, key: "passkey.confirm", stepUp: exempt },
    );
    expect(codes(passkey, "L4")).toEqual([]);
    expect(codes(withOptions(ACTION, { ...ACTION.options, stepUp: exempt }), "L4")).toEqual([
      "step_up_exemption_unlisted",
    ]);
  });

  it("refuses an L3 or L4 action a user can call without stepUp, and passes a service-only one", () => {
    expect(codes(ACTION, "L3")).toEqual(["step_up_missing"]);
    expect(codes(ACTION, "L4")).toEqual(["step_up_missing"]);
    expect(codes(withOptions(ACTION, { ...ACTION.options, stepUp: "aal2" }), "L4")).toEqual([]);
    expect(codes(ACTION, "L2")).toEqual([]);
    const service = withOptions(ACTION, { ...ACTION.options, actors: ["service", "system"] });
    expect(codes(service, "L4", false, false)).toEqual([]);
  });

  it("refuses a client write with no idempotency, and passes a written value or no endpoint and no tool", () => {
    const { idempotency: _written, ...undeclared } = ACTION.options;
    const bare = withOptions(ACTION, undeclared);
    expect(codes(bare, "L2")).toEqual(["idempotency_missing"]);
    expect(codes(bare, "L2", true, false)).toEqual(["idempotency_missing"]);
    expect(codes(bare, "L2", false, true)).toEqual(["idempotency_missing"]);
    expect(codes(bare, "L2", false, false)).toEqual([]);
    for (const idempotency of ["optional", "required", "derived"])
      expect(codes(withOptions(ACTION, { ...undeclared, idempotency }), "L2")).toEqual([]);
  });

  it("gives every refusal a fix and the class as its subject", () => {
    const misshapen = withOptions(ACTION, { key: "order.cancel", actors: ["user"], cache: {} });
    const errors = checkCallShape(misshapen, { risk: "L3", routed: true, tool: true });
    expect(errors.map((error) => error.code)).toEqual([
      "action_cache",
      "step_up_missing",
      "idempotency_missing",
    ]);
    for (const error of errors) {
      expect(error.fix).not.toBe("");
      expect(error.subject).toBe("CancelOrderAction");
      expect(error.file).toBe(ACTION.file);
    }
  });

  it("reaches buildManifest's refusals", () => {
    const { idempotency: _written, ...undeclared } = ACTION.options;
    const errors = buildManifest({
      ...COMMERCE_IR,
      classes: COMMERCE_IR.classes.map((declared) =>
        declared === ACTION ? withOptions(ACTION, undeclared) : declared,
      ),
    }).errors.map((error) => `${error.code} ${error.subject}`);
    expect(errors).toEqual(["idempotency_missing CancelOrderAction"]);
  });
});
