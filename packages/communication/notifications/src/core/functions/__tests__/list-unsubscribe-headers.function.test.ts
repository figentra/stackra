/**
 * Stackra file contract:
 * Purpose: unit tests of `listUnsubscribeHeaders`: a mutable category gets both RFC 8058 headers, a transactional or
 *          mandatory one gets none, and a non-https link is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; RFC 8058; stackra-218 (STA-1376).
 */
import { describe, expect, it } from "@stackra/testing";

import { NotificationCategory } from "#core/enums/notification-category.enum";
import { listUnsubscribeHeaders } from "#core/functions/list-unsubscribe-headers.function";

const LINK = "https://acme.example/unsubscribe?token=a.b";

describe("listUnsubscribeHeaders", () => {
  it("gives a bulk category both one-click headers", () => {
    expect(listUnsubscribeHeaders(NotificationCategory.Marketing, [], LINK)).toEqual({
      "List-Unsubscribe": `<${LINK}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    });
    expect(
      Object.keys(listUnsubscribeHeaders(NotificationCategory.Activity, [], LINK)),
    ).toHaveLength(2);
  });

  it("gives none to a category that cannot be muted", () => {
    expect(listUnsubscribeHeaders(NotificationCategory.Transactional, [], LINK)).toEqual({});
    expect(listUnsubscribeHeaders("pickup", ["pickup"], LINK)).toEqual({});
  });

  it("refuses a non-https link", () => {
    expect(() => listUnsubscribeHeaders("marketing", [], "http://acme.example/u")).toThrow(
      TypeError,
    );
  });
});
