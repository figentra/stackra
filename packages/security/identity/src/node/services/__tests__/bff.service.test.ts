/**
 * Stackra file contract:
 * Purpose: unit tests of `BffService`: login sends an `S256` authorization request and sets a sealed `__Host-`
 *          sign-in cookie, and refuses a return URL off the allowed origins; the callback exchanges the code with the
 *          verifier (client secret by HTTP Basic), checks the ID token and sets the `HttpOnly; Secure; SameSite=Lax;
 *          Path=/` session cookie; a wrong state, a missing sign-in cookie, a replayed code (`invalid_grant`) and a
 *          wrong nonce set no session; the session route and `sessionOf` answer the user (and `sid`) or nothing, and refuse a forged cookie; logout
 *          needs the CSRF header, calls `IdpAdmin.endSession` with the token's `sid`, clears the cookie and answers
 *          the provider's end-session URL, and keeps the cookie when the provider fails.
 * Boundary: test only; `fetch` is stubbed as the provider and `IdpAdmin` is the memory driver, so nothing reaches a
 *           network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (decision 8); RFC 7636; RFC 6265bis; STA-1566.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { BffConfig } from "#config/bff.config";
import { IdentityConfig } from "#config/identity.config";
import { IDENTITY_CLAIMS } from "#core/constants/identity-claims.constant";
import { MemoryIdpAdminDriver } from "#core/drivers/memory-idp-admin.driver";
import { base64UrlOf } from "#core/functions/base64-url-of.function";
import { codeChallengeOf } from "#core/functions/code-challenge-of.function";
import { BffService } from "#node/services/bff.service";

const ISSUER = "https://id.acme.example";

const CLIENT_ID = "312909075212468632";

const API = "https://api.acme.example/api/auth";

const APP = "https://console.acme.example";

/** The provider's discovery document. */
const DISCOVERY = {
  issuer: ISSUER,
  authorization_endpoint: `${ISSUER}/oauth/v2/authorize`,
  token_endpoint: `${ISSUER}/oauth/v2/token`,
  end_session_endpoint: `${ISSUER}/oidc/v1/end_session`,
};

/** The base64url JSON of one JWT part. */
function part(value: unknown): string {
  return base64UrlOf(new TextEncoder().encode(JSON.stringify(value)));
}

/** An unsigned JWT with `payload`. */
function jwt(payload: unknown): string {
  return `${part({ alg: "RS256" })}.${part(payload)}.signature`;
}

/** One token request the provider saw. */
interface Seen {
  readonly form: URLSearchParams;
  readonly authorization: string | null;
}

/** Stubs `fetch` as the provider; `token` answers the token endpoint. */
function stubProvider(token: (form: URLSearchParams) => Response): Seen[] {
  const seen: Seen[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (request: Request) => {
      if (request.url === `${ISSUER}/.well-known/openid-configuration`)
        return Response.json(DISCOVERY);
      if (request.url === DISCOVERY.token_endpoint) {
        const form = new URLSearchParams(await request.text());
        seen.push({ form, authorization: request.headers.get("authorization") });
        return token(form);
      }
      return new Response(null, { status: 404 });
    }),
  );
  return seen;
}

/** The secret store holding the BFF's client secret and cookie key. */
const SECRETS = new (class extends SecretStore {
  get(name: string): string | undefined {
    if (name === "IDENTITY_BFF_CLIENT_SECRET") return "client-secret";
    if (name === "IDENTITY_BFF_COOKIE_KEY") return "k".repeat(40);
    return undefined;
  }
})();

/** A service, its provider admin and helpers for the issuer, client and origins above. */
function setup() {
  const idp = new MemoryIdpAdminDriver();
  const identity = buildConfig(IdentityConfig, {
    values: { issuer: ISSUER, clientId: CLIENT_ID },
  });
  const config = buildConfig(BffConfig, {
    values: {
      redirectUri: `${API}/callback`,
      returnOrigins: [APP, "https://*.acme.example"],
    },
    secrets: SECRETS,
  });
  const service = new BffService(identity, config, idp);
  return { idp, service };
}

/** The `Set-Cookie` values of `response`. */
function cookiesOf(response: Response): string[] {
  return response.headers.getSetCookie();
}

/** The `name=value` pair of the cookie `name` set by `response`, for a later `Cookie` header. */
function pairOf(response: Response, name: string): string {
  const cookie = cookiesOf(response).find((value) => value.startsWith(`${name}=`));
  if (cookie === undefined) throw new Error(`No ${name} cookie`);
  return cookie.split(";")[0] ?? "";
}

/** A GET of one BFF route with `cookie`. */
function get(route: string, cookie = ""): Request {
  return new Request(`${API}/${route}`, cookie === "" ? {} : { headers: { cookie } });
}

/** Valid ID token claims for `nonce`, with `claims` over them. */
function idToken(nonce: string, claims: Record<string, unknown> = {}): string {
  return jwt({
    iss: ISSUER,
    aud: [CLIENT_ID],
    exp: Math.floor(Date.now() / 1000) + 600,
    nonce,
    sid: "ses_1",
    [IDENTITY_CLAIMS.userId]: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
    email: "rana@acme.example",
    name: "Rana",
    ...claims,
  });
}

/** Runs login, then answers the callback with `answer(authorize)`; resolves to the callback's response. */
async function signIn(
  service: BffService,
  answer: (authorize: URL) => string = (authorize) =>
    `code=code-1&state=${authorize.searchParams.get("state") ?? ""}`,
  flowCookie?: (cookie: string) => string,
): Promise<Response> {
  const login = await service.handle(get("login?returnTo=%2Fsettings"));
  const authorize = new URL(login.headers.get("location") ?? "");
  const flow = pairOf(login, "__Host-stackra_session_flow");
  return service.handle(
    get(`callback?${answer(authorize)}`, flowCookie === undefined ? flow : flowCookie(flow)),
  );
}

/** A signed-in service and its session cookie pair. */
async function signedIn() {
  let nonce = "";
  stubProvider(() => Response.json({ id_token: idToken(nonce) }));
  const context = setup();
  const response = await signIn(context.service, (authorize) => {
    nonce = authorize.searchParams.get("nonce") ?? "";
    return `code=code-1&state=${authorize.searchParams.get("state") ?? ""}`;
  });
  return { ...context, cookie: pairOf(response, "__Host-stackra_session") };
}

/** A logout request with `cookie` and, unless `csrf` is false, the CSRF header. */
function logout(cookie: string, csrf = true): Request {
  return new Request(`${API}/logout`, {
    method: "POST",
    headers: csrf ? { cookie, "x-stackra-csrf": "1" } : { cookie },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BffService", () => {
  it("starts the sign-in with S256 and a sealed __Host- sign-in cookie", async () => {
    stubProvider(() => new Response(null, { status: 500 }));
    const { service } = setup();
    const response = await service.handle(
      get("login?returnTo=%2Fsettings&scope=urn%3Azitadel%3Aiam%3Aorg%3Aidp%3Aid%3A9&prompt=login"),
    );
    expect(response.status).toBe(302);
    const authorize = new URL(response.headers.get("location") ?? "");
    expect(`${authorize.origin}${authorize.pathname}`).toBe(DISCOVERY.authorization_endpoint);
    expect(authorize.searchParams.get("client_id")).toBe(CLIENT_ID);
    expect(authorize.searchParams.get("redirect_uri")).toBe(`${API}/callback`);
    expect(authorize.searchParams.get("code_challenge_method")).toBe("S256");
    expect(authorize.searchParams.get("prompt")).toBe("login");
    expect(authorize.searchParams.get("scope")).toContain("urn:zitadel:iam:org:idp:id:9");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const [flow] = cookiesOf(response);
    expect(flow).toMatch(
      /^__Host-stackra_session_flow=[\w-]+; Path=\/; Max-Age=600; HttpOnly; Secure; SameSite=Lax$/,
    );
    // The verifier, state and nonce are sealed, never readable in the cookie.
    expect(flow).not.toContain(authorize.searchParams.get("state") ?? "-");
  });

  it.each([
    ["another origin", "https://evil.example/"],
    ["a scheme-relative URL", "//evil.example/x"],
    ["a backslash trick", "/\\evil.example"],
    ["a javascript URL", "javascript:alert(1)"],
  ])("refuses a return URL on %s", async (_case, returnTo) => {
    stubProvider(() => new Response(null, { status: 500 }));
    const { service } = setup();
    const response = await service.handle(get(`login?returnTo=${encodeURIComponent(returnTo)}`));
    expect(response.status).toBe(400);
    expect(response.headers.get("location")).toBeNull();
  });

  it("accepts a return URL on a wildcard origin", async () => {
    stubProvider(() => new Response(null, { status: 500 }));
    const { service } = setup();
    const response = await service.handle(
      get(`login?returnTo=${encodeURIComponent("https://ops.acme.example/x")}`),
    );
    expect(response.status).toBe(302);
  });

  it("exchanges the code with the verifier and sets the session cookie", async () => {
    let nonce = "";
    let challenge = "";
    const seen = stubProvider(() => Response.json({ id_token: idToken(nonce), access_token: "a" }));
    const { service } = setup();
    const response = await signIn(service, (authorize) => {
      nonce = authorize.searchParams.get("nonce") ?? "";
      challenge = authorize.searchParams.get("code_challenge") ?? "";
      return `code=code-1&state=${authorize.searchParams.get("state") ?? ""}`;
    });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(`${APP}/settings`);
    const cookies = cookiesOf(response);
    expect(cookies).toContain(
      "__Host-stackra_session_flow=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
    );
    expect(cookies.find((cookie) => cookie.startsWith("__Host-stackra_session="))).toMatch(
      /; Path=\/; Max-Age=28800; HttpOnly; Secure; SameSite=Lax$/,
    );
    const [exchange] = seen;
    expect(exchange?.form.get("grant_type")).toBe("authorization_code");
    expect(exchange?.form.get("code")).toBe("code-1");
    expect(exchange?.authorization).toBe(`Basic ${btoa(`${CLIENT_ID}:client-secret`)}`);
    expect(await codeChallengeOf(exchange?.form.get("code_verifier") ?? "")).toBe(challenge);

    const session = await service.handle(
      get("session", pairOf(response, "__Host-stackra_session")),
    );
    expect(session.status).toBe(200);
    expect(await session.json()).toMatchObject({
      user: { userId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3", email: "rana@acme.example" },
    });
  });

  it("refuses a callback with another state", async () => {
    const seen = stubProvider(() => Response.json({}));
    const { service } = setup();
    const response = await signIn(service, () => "code=code-1&state=forged");
    expect(response.headers.get("location")).toBe(`${APP}/settings?sign_in_error=1`);
    expect(cookiesOf(response).some((c) => c.startsWith("__Host-stackra_session="))).toBe(false);
    expect(seen).toHaveLength(0);
  });

  it("refuses a callback without the sign-in cookie", async () => {
    const seen = stubProvider(() => Response.json({}));
    const { service } = setup();
    const response = await signIn(service, undefined, () => "");
    expect(response.headers.get("location")).toBe(`${APP}/?sign_in_error=1`);
    expect(seen).toHaveLength(0);
  });

  it("refuses a replayed code", async () => {
    stubProvider(() => Response.json({ error: "invalid_grant" }, { status: 400 }));
    const { service } = setup();
    const response = await signIn(service);
    expect(response.headers.get("location")).toBe(`${APP}/settings?sign_in_error=1`);
    expect(cookiesOf(response).some((c) => c.startsWith("__Host-stackra_session="))).toBe(false);
  });

  it.each([
    ["another nonce", { nonce: "other" }],
    ["another issuer", { iss: "https://evil.example" }],
    ["another audience", { aud: "other-client" }],
    ["an expired token", { exp: 1 }],
    ["no provider session id", { sid: undefined }],
  ])("refuses an ID token with %s", async (_case, claims) => {
    let nonce = "";
    stubProvider(() => Response.json({ id_token: idToken(nonce, claims) }));
    const { service } = setup();
    const response = await signIn(service, (authorize) => {
      nonce = authorize.searchParams.get("nonce") ?? "";
      return `code=code-1&state=${authorize.searchParams.get("state") ?? ""}`;
    });
    expect(response.headers.get("location")).toBe(`${APP}/settings?sign_in_error=1`);
    expect(cookiesOf(response).some((c) => c.startsWith("__Host-stackra_session="))).toBe(false);
  });

  it("reads the session a host turns into the call's actor", async () => {
    const { service, cookie } = await signedIn();
    const session = await service.sessionOf(get("orders", cookie));
    expect(session?.sid).toBe("ses_1");
    expect(session?.user.userId).toBe("usr_01j9z3k4m5n6p7q8r9s0t1v2w3");
    expect(await service.sessionOf(get("orders"))).toBeUndefined();
    expect(await service.sessionOf(get("orders", "__Host-stackra_session=abc"))).toBeUndefined();
  });

  it("answers 401 without a session and for a forged or swapped cookie", async () => {
    stubProvider(() => Response.json({}));
    const { service } = setup();
    expect((await service.handle(get("session"))).status).toBe(401);
    expect((await service.handle(get("session", "__Host-stackra_session=abc"))).status).toBe(401);
    const login = await service.handle(get("login"));
    // A sign-in cookie's sealed value under the session cookie's name does not open.
    const swapped = pairOf(login, "__Host-stackra_session_flow").replace("_flow=", "=");
    expect((await service.handle(get("session", swapped))).status).toBe(401);
  });

  it("ends the provider session, clears the cookie and answers the end-session URL", async () => {
    const { idp, service, cookie } = await signedIn();
    const ended = vi.spyOn(idp, "endSession");
    const response = await service.handle(logout(cookie));
    expect(response.status).toBe(200);
    expect(ended).toHaveBeenCalledWith("ses_1");
    expect(cookiesOf(response)).toEqual([
      "__Host-stackra_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
    ]);
    const { redirectTo } = (await response.json()) as { redirectTo: string };
    const end = new URL(redirectTo);
    expect(`${end.origin}${end.pathname}`).toBe(DISCOVERY.end_session_endpoint);
    expect(end.searchParams.get("client_id")).toBe(CLIENT_ID);
    expect(end.searchParams.get("post_logout_redirect_uri")).toBe(`${APP}/`);
  });

  it("refuses a logout without the CSRF header and a GET logout", async () => {
    const { idp, service, cookie } = await signedIn();
    const ended = vi.spyOn(idp, "endSession");
    expect((await service.handle(logout(cookie, false))).status).toBe(403);
    expect((await service.handle(get("logout", cookie))).status).toBe(405);
    expect(ended).not.toHaveBeenCalled();
  });

  it("answers 401 to a logout without a session", async () => {
    const { service } = await signedIn();
    expect((await service.handle(logout(""))).status).toBe(401);
  });

  it("keeps the cookie when the provider cannot end the session", async () => {
    const { idp, service, cookie } = await signedIn();
    vi.spyOn(idp, "endSession").mockRejectedValue(new Error("down"));
    await expect(service.handle(logout(cookie))).rejects.toThrow("down");
  });

  it("refuses to seal with a short cookie key", async () => {
    stubProvider(() => Response.json({}));
    const service = new BffService(
      buildConfig(IdentityConfig, { values: { issuer: ISSUER, clientId: CLIENT_ID } }),
      buildConfig(BffConfig, { values: { redirectUri: `${API}/callback`, returnOrigins: [APP] } }),
      new MemoryIdpAdminDriver(),
    );
    await expect(service.handle(get("login"))).rejects.toThrow(TypeError);
  });

  it("answers 404 for an unknown route", async () => {
    const { service } = setup();
    expect((await service.handle(get("nope"))).status).toBe(404);
  });
});
