/**
 * Stackra file contract:
 * Purpose: unit tests of the built-in auto-capture events `PageViewed`, `ScreenViewed` and `ElementClicked`: their
 *          locked names and the schemas that keep queries, hashes and free text out.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; analytics gap 9 (stackra-409).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { ElementClicked } from "#core/analytics/element-clicked.analytics-event";
import { PageViewed } from "#core/analytics/page-viewed.analytics-event";
import { ScreenViewed } from "#core/analytics/screen-viewed.analytics-event";

describe("built-in auto-capture events", () => {
  it("are analytics events with their names", () => {
    expect(kindOf(PageViewed)?.options["name"]).toBe("page.viewed");
    expect(kindOf(ScreenViewed)?.options["name"]).toBe("screen.viewed");
    expect(kindOf(ElementClicked)?.options["name"]).toBe("element.clicked");
    expect(kindOf(PageViewed)?.kind).toBe("analytics_event");
  });

  it("refuses a path with a query or a hash", () => {
    expect(schemaOf(PageViewed).safeParse({ path: "/pricing" }).success).toBe(true);
    expect(schemaOf(PageViewed).safeParse({ path: "/reset?token=x" }).success).toBe(false);
    expect(schemaOf(PageViewed).safeParse({ path: "/a#b" }).success).toBe(false);
  });

  it("takes a data-track name, never free text", () => {
    const schema = schemaOf(ElementClicked);
    expect(schema.safeParse({ target: "checkout.pay", path: "/checkout" }).success).toBe(true);
    expect(schema.safeParse({ target: "Pay now", path: "/checkout" }).success).toBe(false);
    expect(schemaOf(ScreenViewed).safeParse({ screen: "" }).success).toBe(false);
  });
});
