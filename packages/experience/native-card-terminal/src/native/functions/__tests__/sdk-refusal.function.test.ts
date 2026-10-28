/**
 * Stackra file contract:
 * Purpose: proves `sdkRefusal` refuses a permission error with `permission_denied` on `bluetooth` and any other error
 *          with `unavailable` on `card_terminal`, and never copies the SDK's message.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0479 (decision 2); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { sdkRefusal } from "#native/functions/sdk-refusal.function";

describe("sdkRefusal", () => {
  it("tells a refused permission from any other error", () => {
    expect(sdkRefusal({ code: "bluetoothAccessDenied", message: "denied" })).toEqual({
      ok: false,
      error: { code: "permission_denied", capability: "bluetooth" },
    });
    expect(sdkRefusal({ code: "LOCATION_SERVICES_DISABLED" })).toEqual({
      ok: false,
      error: { code: "permission_denied", capability: "bluetooth" },
    });
    expect(sdkRefusal({ code: "readerBusy", message: "busy" })).toEqual({
      ok: false,
      error: { code: "unavailable", capability: "card_terminal" },
    });
  });
});
