/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/identity`
 *          (`AuthFlow`, `IdentityConfig`, `IdentityConfig$`, `SessionStatus`, `SignInCancelledError`) is exported,
 *          with the session service, the drivers, the claims mapping and the other refusal; the ports and the internals
 *          are not; and the shipped schema extends as the template's generated mobile schema does.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as identity from "#core/index";
import type { SessionState } from "#core/index";

describe("@stackra/identity", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(identity).sort()).toEqual([
      "AuthFlow",
      "BffSessionStoreDriver",
      "IDENTITY_CLAIMS",
      "IdentityConfig",
      "IdentityConfig$",
      "IdentityOptions",
      "MemoryIdentityResolverDriver",
      "MemorySessionStoreDriver",
      "PkceSessionStoreDriver",
      "SessionClientSessionDriver",
      "SessionOfflineSessionDriver",
      "SessionRevokedError",
      "SessionService",
      "SessionStatus",
      "SignInCancelledError",
      "sessionUserOf",
    ]);
  });

  it("keeps the ports and the internals out of the entry", () => {
    for (const name of [
      "SessionStore",
      "SignInBrowser",
      "IDENTITY_CONFIG_SCHEMA",
      "SESSION_USER_SCHEMA",
      "randomToken",
      "codeChallengeOf",
      "jwtClaimsOf",
      "base64UrlOf",
    ]) {
      expect(name in identity).toBe(false);
    }
  });

  it("ships a schema a member's generated override extends, as the template's mobile sample does", () => {
    const base = identity.IdentityConfig$;
    const extended = base.extend({
      nativeRedirectPath: base.shape.nativeRedirectPath.unwrap().default("auth/callback"),
      scopes: base.shape.scopes
        .unwrap()
        .default(() => ["openid", "profile", "email", "offline_access"]),
      idleMinutes: base.shape.idleMinutes.unwrap().default(30),
      refreshOnForeground: base.shape.refreshOnForeground.unwrap().default(true),
    });
    expect(extended.parse({}).idleMinutes).toBe(30);
  });

  it("types the session state as a union on status", () => {
    expectTypeOf<Extract<SessionState, { status: "signed_in" }>["user"]>().not.toBeNull();
    expectTypeOf<Extract<SessionState, { status: "revoked" }>["user"]>().toBeNull();
  });
});
