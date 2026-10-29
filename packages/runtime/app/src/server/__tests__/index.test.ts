/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./server` entry: `createApp` (the template's service entries import it),
 *          the `Controller` kind, the `RequestGuard` extension point, `AppDrainingError` and the edge-header guard
 *          with its memory drivers and refusal, the bearer-token guard with its config, key drivers, refusal and
 *          `VerifiedToken`, the origin and CSRF guards with their configuration and refusals,
 *          `apiCacheControl` and `corsHeaders` are exported, nothing else is, and `createApp` resolves to a `ServerApp`.
 * Boundary: test only; imports the stand-in barrel through its `#server` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decision 8); ADR 0127 2026-10-24 note; ADR 0437.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as server from "#server/index";
import type { ServerApp, ServerHandlers } from "#server/index";

describe("@stackra/app/server", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(server).sort()).toEqual([
      "AppDrainingError",
      "BearerConfig",
      "BearerTokenGuard",
      "BearerTokenInvalidError",
      "Controller",
      "CorsConfig",
      "CsrfConfig",
      "CsrfGuard",
      "CsrfTokenInvalidError",
      "EdgeHeaderGuard",
      "EdgeSignatureInvalidError",
      "MemoryEdgeNonceStoreDriver",
      "MemoryEdgeSigningKeysDriver",
      "MemoryJsonWebKeysDriver",
      "OidcJsonWebKeysDriver",
      "OriginGuard",
      "OriginNotAllowedError",
      "RequestGuard",
      "VerifiedToken",
      "apiCacheControl",
      "corsHeaders",
      "createApp",
    ]);
  });

  it("resolves createApp to a ServerApp", () => {
    expectTypeOf(server.createApp).returns.resolves.toEqualTypeOf<ServerApp>();
    expectTypeOf<ServerApp["handlers"]>().toEqualTypeOf<ServerHandlers>();
  });
});
