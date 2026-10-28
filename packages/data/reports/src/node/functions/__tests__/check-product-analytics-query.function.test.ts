/**
 * Stackra file contract:
 * Purpose: unit tests of `checkProductAnalyticsQuery`: well-formed funnel, retention and cohort calls pass; a bad step
 *          count, window, interval count, period, day, reversed or over-long range, empty event name, unsafe property
 *          name, the scope property, an empty or non-scalar value list are refused without echoing a value.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0163 (decision 5 as amended 2026-10-28); ADR 0160.
 */
import { describe, expect, it } from "@stackra/testing";

import { RetentionPeriod } from "#contracts/enums/retention-period.enum";
import type { FunnelQuery } from "#contracts/types/funnel-query.type";
import { ProductAnalyticsQueryInvalidError } from "#node/errors/product-analytics-query-invalid.error";
import { checkProductAnalyticsQuery } from "#node/functions/check-product-analytics-query.function";
import type { ProductAnalyticsCall } from "#node/types/product-analytics-call.type";

const range = { from: "2026-10-01", to: "2026-10-28" };
const funnel: FunnelQuery = {
  steps: [{ event: "cart_viewed", where: { channel: ["web", "app"] } }, { event: "order_placed" }],
  range,
  windowDays: 7,
};
const retention = {
  startEvent: "signed_up",
  returnEvent: "order_placed",
  period: RetentionPeriod.Week,
  intervals: 8,
  range,
};
const cohort = { match: { event: "order_placed" }, period: RetentionPeriod.Month, range };

/** The refusal checking `call` throws. */
function refusalOf(
  call: ProductAnalyticsCall,
  scopeProperty: string | null = "scope_id",
): ProductAnalyticsQueryInvalidError {
  try {
    checkProductAnalyticsQuery(call, scopeProperty);
  } catch (error) {
    expect(error).toBeInstanceOf(ProductAnalyticsQueryInvalidError);
    return error as ProductAnalyticsQueryInvalidError;
  }
  throw new Error("expected a refusal");
}

/** A funnel whose first step filters by `where`. */
function funnelWhere(where: Readonly<Record<string, unknown>>): ProductAnalyticsCall {
  const steps = [{ event: "a", where }, { event: "b" }];
  return { kind: "funnel", query: { ...funnel, steps } as unknown as FunnelQuery };
}

describe(checkProductAnalyticsQuery, () => {
  it("passes well-formed calls", () => {
    expect(() =>
      checkProductAnalyticsQuery({ kind: "funnel", query: funnel }, "scope_id"),
    ).not.toThrow();
    expect(() =>
      checkProductAnalyticsQuery({ kind: "retention", query: retention }, null),
    ).not.toThrow();
    expect(() =>
      checkProductAnalyticsQuery({ kind: "cohort", query: cohort }, "scope_id"),
    ).not.toThrow();
  });

  it("refuses bad steps, windows and ranges", () => {
    expect(
      refusalOf({ kind: "funnel", query: { ...funnel, steps: [{ event: "a" }] } }).reason,
    ).toMatch(/2 to 20 steps/);
    expect(refusalOf({ kind: "funnel", query: { ...funnel, windowDays: 0 } }).reason).toMatch(
      /windowDays/,
    );
    expect(
      refusalOf({
        kind: "funnel",
        query: { ...funnel, range: { from: "2026-02-30", to: "2026-03-01" } },
      }).reason,
    ).toMatch(/real YYYY-MM-DD/);
    expect(
      refusalOf({
        kind: "funnel",
        query: { ...funnel, range: { from: "2026-10-28", to: "2026-10-01" } },
      }).reason,
    ).toMatch(/after/);
    expect(
      refusalOf({
        kind: "funnel",
        query: { ...funnel, range: { from: "2020-01-01", to: "2026-01-01" } },
      }).reason,
    ).toMatch(/731 days/);
  });

  it("refuses unsafe matches and the scope property, without echoing values", () => {
    expect(refusalOf(funnelWhere({ "a b": "x" })).reason).toMatch(/not allowed/);
    expect(refusalOf(funnelWhere({ scope_id: "org_2" })).reason).toMatch(/scope/);
    expect(refusalOf(funnelWhere({ plan: [] })).reason).toMatch(/1 to 100/);
    expect(refusalOf(funnelWhere({ plan: { secret: "s3cr3t" } })).reason).not.toContain("s3cr3t");
    expect(
      refusalOf({ kind: "funnel", query: { ...funnel, steps: [{ event: "" }, { event: "b" }] } })
        .query,
    ).toBe("funnel");
  });

  it("refuses bad retention periods and intervals, and the scope property in a cohort", () => {
    expect(refusalOf({ kind: "retention", query: { ...retention, intervals: 53 } }).reason).toMatch(
      /1 to 52/,
    );
    expect(
      refusalOf({ kind: "retention", query: { ...retention, period: "year" as RetentionPeriod } })
        .reason,
    ).toMatch(/day, week or month/);
    expect(
      refusalOf({
        kind: "cohort",
        query: { ...cohort, match: { event: "a", where: { scope_id: "org_2" } } },
      }).query,
    ).toBe("cohort");
  });
});
