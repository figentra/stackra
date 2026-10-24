/**
 * Stackra file contract:
 * Purpose: unit tests of `bearerToken`: sets `Authorization: Bearer <token>` from a sync or async source asked once
 *          per request, sends the request as it is when there is no token, and never overrides a header already set.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0206.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { bearerToken } from "#core/functions/bearer-token.function";
import { createTransport } from "#core/functions/create-transport.function";
import type { TokenSource } from "#core/types/token-source.type";

/** Sends one GET through `bearerToken(source)` and returns the Authorization header that reached fetch. */
async function sentAuthorization(source: TokenSource, init?: RequestInit): Promise<string | null> {
  let seen: string | null = null;
  const send = createTransport({
    middleware: [bearerToken(source)],
    fetch: async (request) => {
      seen = request.headers.get("Authorization");
      return new Response(null, { status: 204 });
    },
  });
  await send(new Request("https://api.test/orders", init));
  return seen;
}

describe("bearerToken", () => {
  it("sends the token from a sync source", async () => {
    expect(await sentAuthorization(() => "abc")).toBe("Bearer abc");
  });

  it("sends the token from an async source, asked on every request", async () => {
    const source = vi.fn(async () => "fresh");
    expect(await sentAuthorization(source)).toBe("Bearer fresh");
    expect(await sentAuthorization(source)).toBe("Bearer fresh");
    expect(source).toHaveBeenCalledTimes(2);
  });

  it("sends no header when signed out or the token is empty", async () => {
    expect(await sentAuthorization(() => undefined)).toBeNull();
    expect(await sentAuthorization(() => "")).toBeNull();
  });

  it("keeps an Authorization header already set and does not ask the source", async () => {
    const source = vi.fn(() => "abc");
    expect(await sentAuthorization(source, { headers: { Authorization: "Basic xyz" } })).toBe(
      "Basic xyz",
    );
    expect(source).not.toHaveBeenCalled();
  });
});
