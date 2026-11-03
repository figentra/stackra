/**
 * Stackra file contract:
 * Purpose: unit tests of `routeTitleKey`: `<module>::routes.<snake(stem)>.title` from a route's module and file.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20); STA-2058.
 */
import { describe, expect, it } from "@stackra/testing";

import { routeTitleKey } from "#core/functions/route-title-key.function";

describe("routeTitleKey", () => {
  it("derives the title key from the module and the file stem", () => {
    expect(routeTitleKey("web", "src/routes/order-detail/order-detail.route.ts")).toBe(
      "web::routes.order_detail.title",
    );
    expect(routeTitleKey("loyalty_kit", "src/react/points/points.route.tsx")).toBe(
      "loyalty_kit::routes.points.title",
    );
  });
});
