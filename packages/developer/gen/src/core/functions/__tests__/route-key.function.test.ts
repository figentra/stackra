/**
 * Stackra file contract:
 * Purpose: unit tests of `routeKey`: the snake_case of the route file's stem.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20).
 */
import { describe, expect, it } from "@stackra/testing";

import { routeKey } from "#core/functions/route-key.function";

describe("routeKey", () => {
  it("snake-cases the file stem", () => {
    expect(routeKey("src/routes/order-detail/order-detail.route.ts")).toBe("order_detail");
    expect(routeKey("src/routes/settings/settings.route.tsx")).toBe("settings");
  });
});
