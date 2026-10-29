/**
 * Stackra file contract:
 * Purpose: unit tests of `signInProvidersOf` and `externalSignIn`: a market's providers come from its pack in order,
 *          only those configured here; a configured Apple follows in every market; a configured provider becomes its
 *          hint scope; an unknown one is refused.
 * Boundary: test only; a resolved pack built in memory (one layer), no signature involved.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; owner round 3 #21; ADR 0370; STA-1578.
 */
import { buildConfig } from "@stackra/config";
import type { MarketPack, ResolvedPack } from "@stackra/market-packs";
import { describe, expect, it } from "@stackra/testing";

import { IdentityConfig } from "#config/identity.config";
import { SocialProvider } from "#core/enums/social-provider.enum";
import { externalSignIn } from "#core/functions/external-sign-in.function";
import { signInProvidersOf } from "#core/functions/sign-in-providers-of.function";

const identity = buildConfig(IdentityConfig, {
  values: { externalProviders: { national_id: "301", gov_wallet: "302" } },
});

/** A one-layer pack listing `providers` from 2026-01-01. */
function packWith(providers: unknown): ResolvedPack {
  const layer = {
    market: "xx",
    version: "1.0.0",
    entries: [{ key: "identity.sign_in_providers", value: providers, from: "2026-01-01" }],
  } as unknown as MarketPack;
  return { market: "xx", layers: [layer] };
}

describe("signInProvidersOf", () => {
  it("lists the pack's providers configured here, in the pack's order", () => {
    expect(
      signInProvidersOf(packWith(["gov_wallet", "other", "national_id"]), "2026-10-25", identity),
    ).toEqual(["gov_wallet", "national_id"]);
    expect(signInProvidersOf(packWith("national_id"), "2026-10-25", identity)).toEqual([]);
    expect(signInProvidersOf(packWith(["national_id"]), "2025-12-31", identity)).toEqual([]);
  });
});

describe("signInProvidersOf with Sign in with Apple", () => {
  const withApple = buildConfig(IdentityConfig, {
    values: { externalProviders: { national_id: "301", apple: "309" } },
  });

  it("offers a configured Apple in every market, once, after the pack's providers", () => {
    expect(signInProvidersOf(packWith(["national_id"]), "2026-10-25", withApple)).toEqual([
      "national_id",
      "apple",
    ]);
    expect(signInProvidersOf(packWith(["apple", "national_id"]), "2026-10-25", withApple)).toEqual([
      "apple",
      "national_id",
    ]);
    expect(signInProvidersOf(packWith("none"), "2026-10-25", withApple)).toEqual(["apple"]);
  });

  it("sends the hosted sign-in to ZITADEL's Apple provider", () => {
    expect(externalSignIn(SocialProvider.Apple, withApple)).toEqual({
      scopes: ["urn:zitadel:iam:org:idp:id:309"],
    });
  });
});

describe("externalSignIn", () => {
  it("hints the configured provider and refuses an unknown one", () => {
    expect(externalSignIn("national_id", identity)).toEqual({
      scopes: ["urn:zitadel:iam:org:idp:id:301"],
    });
    expect(() => externalSignIn("other", identity)).toThrow(RangeError);
  });
});
