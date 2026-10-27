/**
 * Stackra file contract:
 * Purpose: unit tests of `preferenceAllows`: mandatory and transactional categories are always allowed whatever the
 *          choice; a recorded choice wins otherwise; with none, marketing (opt-in) is off and activity or a service
 *          category is on.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0223 (decision 5); ACA-539; stackra-218 (STA-1376).
 */
import { describe, expect, it } from "@stackra/testing";

import { NotificationCategory } from "#core/enums/notification-category.enum";
import { preferenceAllows } from "#core/functions/preference-allows.function";

describe("preferenceAllows", () => {
  it("always allows a category that cannot be muted", () => {
    expect(preferenceAllows("pickup", ["pickup"], false)).toBe(true);
    expect(preferenceAllows(NotificationCategory.Transactional, [], false)).toBe(true);
  });

  it("follows a recorded choice", () => {
    expect(preferenceAllows(NotificationCategory.Marketing, [], true)).toBe(true);
    expect(preferenceAllows(NotificationCategory.Activity, [], false)).toBe(false);
  });

  it("needs an opt-in for marketing and none for the rest", () => {
    expect(preferenceAllows(NotificationCategory.Marketing, [], undefined)).toBe(false);
    expect(preferenceAllows(NotificationCategory.Activity, [], undefined)).toBe(true);
    expect(preferenceAllows("security", [], undefined)).toBe(true);
  });
});
