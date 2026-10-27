/**
 * Stackra file contract:
 * Purpose: unit tests of `signInMethodsOf`: a market's built-in methods come from its pack in order, `app_approval`
 *          among them; a key the scope switched off, an unknown key and a non-list value are dropped.
 * Boundary: test only; a resolved pack built in memory (one layer), no signature involved.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; STA-1304.
 */
import { buildConfig } from "@stackra/config";
import type { MarketPack, ResolvedPack } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import { IdentityConfig } from "#config/identity.config";
import { SignInMethod } from "#core/enums/sign-in-method.enum";
import { signInMethodsOf } from "#core/functions/sign-in-methods-of.function";

const identity = buildConfig(IdentityConfig, { values: {} });

/** A one-layer pack listing `methods` from 2026-01-01. */
function packWith(methods: unknown): ResolvedPack {
  const layer = {
    market: "xx",
    version: "1.0.0",
    entries: [{ key: "identity.sign_in_methods", value: methods, from: "2026-01-01" }],
  } as unknown as MarketPack;
  return { market: "xx", layers: [layer] };
}

describe("signInMethodsOf", () => {
  it("lists the pack's built-in methods in the pack's order", () => {
    expect(
      signInMethodsOf(packWith(["passkey", "app_approval", "password"]), "2026-10-27", identity),
    ).toEqual([SignInMethod.Passkey, SignInMethod.AppApproval, SignInMethod.Password]);
  });

  it("drops what the scope switched off and what it does not know", () => {
    expect(
      signInMethodsOf(
        packWith(["passkey", "app_approval", "carrier_pigeon"]),
        "2026-10-27",
        identity,
        ["app_approval"],
      ),
    ).toEqual([SignInMethod.Passkey]);
  });

  it("answers none for a value that is not a list, or before the entry starts", () => {
    expect(signInMethodsOf(packWith("passkey"), "2026-10-27", identity)).toEqual([]);
    expect(signInMethodsOf(packWith(["passkey"]), "2025-12-31", identity)).toEqual([]);
  });
});
