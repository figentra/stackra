/**
 * Stackra file contract:
 * Purpose: unit tests of `modeOf`: a gateway with no mode is `own-key`, the fixed modes and a named legacy mode pass,
 *          and any other value is a configuration error.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; R4-6; A3-1.
 */
import { describe, expect, it } from "@stackra/testing";

import type { PaymentConnectionMode } from "#contracts/types/payment-connection-mode.type";
import { modeOf } from "#core/functions/mode-of.function";

const gateway = (mode?: string) => ({
  provider: "stripe",
  ...(mode === undefined ? {} : { mode: mode as PaymentConnectionMode }),
});

describe("modeOf", () => {
  it("defaults to own-key and keeps the four modes", () => {
    expect(modeOf(gateway())).toBe("own-key");
    for (const mode of ["oauth-standard", "own-key", "connected-account"])
      expect(modeOf(gateway(mode))).toBe(mode);
    expect(modeOf(gateway("legacy-connected-account:academorix"))).toBe(
      "legacy-connected-account:academorix",
    );
  });

  it("refuses any other value", () => {
    expect(() => modeOf(gateway("connected"))).toThrow(TypeError);
    expect(() => modeOf(gateway("legacy-connected-account:"))).toThrow(/legacy/);
  });
});
