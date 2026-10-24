/**
 * Stackra file contract:
 * Purpose: unit tests of `browserPermission`: `default` reads `prompt`, the other states pass through, and a missing
 *          Notifications API reads `denied`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0255 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { browserPermission } from "#browser/functions/browser-permission.function";

describe("browserPermission", () => {
  it("spells the browser's states as the port does", () => {
    expect(browserPermission("default")).toBe("prompt");
    expect(browserPermission("granted")).toBe("granted");
    expect(browserPermission("denied")).toBe("denied");
    expect(browserPermission(undefined)).toBe("denied");
  });
});
