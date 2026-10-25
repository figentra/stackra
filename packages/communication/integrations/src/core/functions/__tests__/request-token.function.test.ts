/**
 * Stackra file contract:
 * Purpose: unit tests of `requestToken`: a grant authenticates the client with Basic or form fields and returns the
 *          tokens with their expiry; a refused grant is `ProviderRefusedError` with the OAuth code; a failed endpoint
 *          or an answer without a token is `ProviderUnavailableError`, with no token in either.
 * Boundary: test only; `fetch` is stubbed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rules 6, 7 and 20); RFC 6749.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ProviderRefusedError } from "#core/errors/provider-refused.error";
import { ProviderUnavailableError } from "#core/errors/provider-unavailable.error";
import { requestToken } from "#core/functions/request-token.function";

const NOW = new Date("2026-10-24T09:00:00Z");

const REQUEST = {
  url: "https://auth.provider.example/token",
  form: { grant_type: "client_credentials", scope: "mail.send" },
  clientId: "client-1",
  clientSecret: "secret-1",
  authentication: "basic",
  provider: "provider",
  now: NOW,
} as const;

/** Stubs `fetch` with one answer and returns the mock. */
function answerWith(response: Response | Error) {
  const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("requestToken", () => {
  it("authenticates with Basic and returns the tokens with their expiry", async () => {
    const fetchMock = answerWith(
      Response.json({
        access_token: "at-1",
        refresh_token: "rt-1",
        expires_in: 3600,
        token_type: "Bearer",
      }),
    );
    await expect(requestToken(REQUEST)).resolves.toEqual({
      accessToken: "at-1",
      refreshToken: "rt-1",
      expiresAt: new Date("2026-10-24T10:00:00Z"),
    });
    const init = fetchMock.mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get("authorization")).toBe(
      `Basic ${btoa("client-1:secret-1")}`,
    );
    expect(String(init?.body)).toBe("grant_type=client_credentials&scope=mail.send");
  });

  it("sends a public client's id as a form field", async () => {
    const fetchMock = answerWith(Response.json({ access_token: "at-2" }));
    await expect(requestToken({ ...REQUEST, clientSecret: undefined })).resolves.toEqual({
      accessToken: "at-2",
    });
    expect(String(fetchMock.mock.calls[0]?.[1].body)).toContain("client_id=client-1");
  });

  it("refuses a refused grant with its OAuth code", async () => {
    answerWith(
      Response.json({ error: "invalid_grant", error_description: "expired" }, { status: 400 }),
    );
    const refused = await requestToken(REQUEST).catch((error: unknown) => error);
    expect(ProviderRefusedError.is(refused, { status: 400, code: "invalid_grant" })).toBe(true);
  });

  it("is unavailable on no answer, a 5xx or an answer without a token", async () => {
    answerWith(new TypeError("fetch failed"));
    await expect(requestToken(REQUEST)).rejects.toBeInstanceOf(ProviderUnavailableError);
    answerWith(new Response("down", { status: 503 }));
    await expect(requestToken(REQUEST)).rejects.toBeInstanceOf(ProviderUnavailableError);
    answerWith(Response.json({ token_type: "Bearer" }));
    await expect(requestToken(REQUEST)).rejects.toBeInstanceOf(ProviderUnavailableError);
  });
});
