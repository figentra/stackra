/**
 * Stackra file contract:
 * Purpose: unit tests of `canMute`: a category the pack lists as mandatory is never mutable, a transactional one never
 *          is, and an activity, marketing or unknown service category is unless listed.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0223 (decision 5); ACA-539; STA-964.
 */
import { describe, expect, it } from "@stackra/testing";

import { NotificationCategory } from "#core/enums/notification-category.enum";
import { canMute } from "#core/functions/can-mute.function";

describe("canMute", () => {
  it("never mutes a category the pack lists as mandatory", () => {
    expect(canMute("pickup", ["pickup", "emergency_broadcast"])).toBe(false);
    expect(canMute(NotificationCategory.Activity, [NotificationCategory.Activity])).toBe(false);
  });

  it("never mutes a transactional notification", () => {
    expect(canMute(NotificationCategory.Transactional, [])).toBe(false);
  });

  it("mutes the rest", () => {
    expect(canMute(NotificationCategory.Activity, ["pickup"])).toBe(true);
    expect(canMute(NotificationCategory.Marketing, [])).toBe(true);
    expect(canMute("newsletter", ["pickup"])).toBe(true);
  });
});
