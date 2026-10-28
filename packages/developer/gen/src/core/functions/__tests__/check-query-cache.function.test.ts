/**
 * Stackra file contract:
 * Purpose: unit tests of `checkQueryCache`: a query cached per site that reads its caller from the context or takes a
 *          caller id as input is refused (`site_cache_reads_caller`); one that reads neither passes, and a query cached
 *          per principal or per scope may read its caller.
 * Boundary: test only; runs on the commerce IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rule 31, as amended 2026-10-28).
 */
import { describe, expect, it } from "@stackra/testing";

import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { checkQueryCache } from "#core/functions/check-query-cache.function";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";

const QUERY = COMMERCE_IR.classes.find((declared) => declared.kind === "query") as DeclaredClass;

/** The fixture with its query changed by `change`, and its input shape given `fields` names when listed. */
function withQuery(change: Partial<DeclaredClass>, fields?: readonly string[]): MemberIR {
  return {
    ...COMMERCE_IR,
    classes: COMMERCE_IR.classes.map((declared) =>
      declared === QUERY ? { ...declared, ...change } : declared,
    ),
    shapes: COMMERCE_IR.shapes.map((shape): ShapeIR =>
      fields === undefined || shape.name !== QUERY.handle?.input
        ? shape
        : {
            ...shape,
            fields: fields.map((name) => ({
              name,
              optional: false,
              nullable: false,
              type: { kind: "string" },
              rules: [],
            })),
          },
    ),
  };
}

const site = (extra: Partial<DeclaredClass> = {}): Partial<DeclaredClass> => ({
  options: { ...QUERY.options, cache: { ttl: "5m", per: "site" } },
  ...extra,
});

describe("checkQueryCache", () => {
  it("refuses a site-cached query that reads its caller from the context", () => {
    const errors = checkQueryCache(withQuery(site({ callerReads: ["actor", "scopeId"] })));
    expect(errors.map((error) => [error.code, error.subject])).toEqual([
      ["site_cache_reads_caller", QUERY.name],
    ]);
    expect(errors[0]?.message).toContain("ctx.actor, ctx.scopeId");
  });

  it("refuses a site-cached query that takes a caller id as input", () => {
    const errors = checkQueryCache(withQuery(site(), ["slug", "customerId"]));
    expect(errors[0]?.message).toContain("input.customerId");
  });

  it("passes a site-cached query that reads neither, and any other query", () => {
    expect(checkQueryCache(withQuery(site(), ["slug", "locale"]))).toEqual([]);
    expect(
      checkQueryCache(
        withQuery({
          options: { ...QUERY.options, cache: { ttl: "5m", per: "scope" } },
          callerReads: ["actor"],
        }),
      ),
    ).toEqual([]);
    expect(checkQueryCache(withQuery({ callerReads: ["actor"] }))).toEqual([]);
  });
});
