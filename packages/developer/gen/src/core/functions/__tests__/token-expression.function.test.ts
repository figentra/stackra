/**
 * Stackra file contract:
 * Purpose: unit tests of `tokenExpression`: a class token, a per-model token and a named instance, each name taken
 *          through `use`, which sees every import the expression needs.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0263; STA-1698.
 */
import { describe, expect, it } from "@stackra/testing";

import { tokenExpression } from "#core/functions/token-expression.function";
import type { ClassRef } from "#core/types/class-ref.type";

describe("tokenExpression", () => {
  const order: ClassRef = { name: "Order", from: "#modules/orders/models/order.model" };

  it("writes a class, a per-model token and a named instance, recording each import", () => {
    const used: ClassRef[] = [];
    const use = (target: ClassRef): string => {
      used.push(target);
      return target.name;
    };

    expect(tokenExpression({ class: order }, use)).toBe("Order");
    expect(
      tokenExpression(
        { class: order, of: { name: "repositoryOf", from: "@stackra/database" } },
        use,
      ),
    ).toBe("repositoryOf(Order)");
    expect(
      tokenExpression(
        { class: { name: "Mailer", from: "@stackra/notifications" }, named: "ops" },
        use,
      ),
    ).toBe('named(Mailer, "ops")');
    expect(used.map((target) => `${target.from}:${target.name}`)).toEqual([
      "#modules/orders/models/order.model:Order",
      "@stackra/database:repositoryOf",
      "#modules/orders/models/order.model:Order",
      "@stackra/notifications:Mailer",
      "@stackra/container:named",
    ]);
  });
});
