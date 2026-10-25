/**
 * Stackra file contract:
 * Purpose: unit tests of `PkceSessionStoreDriver`: sign-in sends an `S256` authorization request through the platform
 *          browser and exchanges the code with the verifier; the ID token's issuer, audience and nonce are checked and
 *          its claims kept with the tokens in the `secrets` area; a closed browser or a declined consent is cancelled,
 *          a wrong state refused; an expiring token is renewed with the refresh token rotated, `invalid_grant` drops
 *          the tokens and refuses `session_revoked`, an outage keeps the session; sign-out drops the tokens and
 *          revokes the refresh token; discovery refuses another issuer and an unset one.
 * Boundary: test only; `fetch` is stubbed as the provider and the browser is a test driver, so nothing reaches a
 *           network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (decisions 8 and 9); ADR 0277; ADR 0338 (decision 4); RFC 7636; RFC 7009.
 */
import { TransportError } from "@stackra/clients";
import { buildConfig } from "@stackra/config";
import type { ConfigValues } from "@stackra/config";
import { Driver } from "@stackra/container";
import { UnauthenticatedError } from "@stackra/errors";
import { MemoryStorageDriver } from "@stackra/storage";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { IdentityConfig } from "#config/identity.config";
import { SignInBrowser } from "#contracts/ports/sign-in-browser.port";
import { IDENTITY_CLAIMS } from "#core/constants/identity-claims.constant";
import { PkceSessionStoreDriver } from "#core/drivers/pkce-session-store.driver";
import { SessionRevokedError } from "#core/errors/session-revoked.error";
import { SignInCancelledError } from "#core/errors/sign-in-cancelled.error";
import { base64UrlOf } from "#core/functions/base64-url-of.function";
import { codeChallengeOf } from "#core/functions/code-challenge-of.function";

const ISSUER = "https://id.acme.example";

const CLIENT_ID = "312909075212468632";

/** The provider's discovery document. */
const DISCOVERY = {
  issuer: ISSUER,
  authorization_endpoint: `${ISSUER}/oauth/v2/authorize`,
  token_endpoint: `${ISSUER}/oauth/v2/token`,
  revocation_endpoint: `${ISSUER}/oauth/v2/revoke`,
};

/** The user the ID token describes. */
const USER = {
  userId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  email: "rana@acme.example",
  displayName: "Rana",
  permissions: [],
  tenants: [],
};

/** The base64url JSON of one JWT part. */
function part(value: unknown): string {
  return base64UrlOf(new TextEncoder().encode(JSON.stringify(value)));
}

/** An unsigned JWT with `payload`. */
function jwt(payload: unknown): string {
  return `${part({ alg: "RS256" })}.${part(payload)}.signature`;
}

/** A browser that answers the authorization request as `answer` says; by default with a code and the sent state. */
class TestBrowserDriver extends Driver(SignInBrowser) {
  /** The last authorization request. */
  request: URL | undefined;

  /** How the provider answers. */
  answer: (request: URL, redirectUri: string) => string | null = (request, redirectUri) =>
    `${redirectUri}?code=code-1&state=${request.searchParams.get("state") ?? ""}`;

  redirectUri(path: string): string {
    return `acme://${path}`;
  }

  async authorize(url: string, redirectUri: string): Promise<string | null> {
    this.request = new URL(url);
    return this.answer(this.request, redirectUri);
  }
}

/** One request the provider saw. */
interface Seen {
  readonly url: string;
  readonly form: URLSearchParams | undefined;
}

/** Stubs `fetch` as the provider; `token` answers the token endpoint. */
function stubProvider(token: (form: URLSearchParams) => Response): Seen[] {
  const seen: Seen[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (request: Request) => {
      const form =
        request.method === "POST" ? new URLSearchParams(await request.text()) : undefined;
      seen.push({ url: request.url, form });
      if (request.url === `${ISSUER}/.well-known/openid-configuration`)
        return Response.json(DISCOVERY);
      if (request.url === DISCOVERY.token_endpoint && form !== undefined) return token(form);
      if (request.url === DISCOVERY.revocation_endpoint) return new Response(null, { status: 200 });
      return new Response(null, { status: 404 });
    }),
  );
  return seen;
}

/** A driver, its storage and its browser, for the issuer and client above. */
function setup(values: Partial<ConfigValues<IdentityConfig>> = {}) {
  const storage = new MemoryStorageDriver();
  const browser = new TestBrowserDriver();
  const config = buildConfig(IdentityConfig, {
    values: { issuer: ISSUER, clientId: CLIENT_ID, ...values },
  });
  const driver = new PkceSessionStoreDriver(config, storage, browser);
  /** A token answer whose ID token carries `claims` over valid defaults. */
  const tokens = (claims: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) =>
    Response.json({
      access_token: "access-1",
      token_type: "Bearer",
      expires_in: 600,
      refresh_token: "refresh-1",
      id_token: jwt({
        iss: ISSUER,
        aud: [CLIENT_ID],
        exp: Math.floor(Date.now() / 1000) + 3600,
        nonce: browser.request?.searchParams.get("nonce"),
        email: USER.email,
        name: USER.displayName,
        [IDENTITY_CLAIMS.userId]: USER.userId,
        ...claims,
      }),
      ...extra,
    });
  return { storage, browser, driver, tokens };
}

/** A kept session whose access token expires within the renewal window. */
function expiring(refreshToken: string | undefined = "refresh-0") {
  return {
    accessToken: "access-0",
    ...(refreshToken === undefined ? {} : { refreshToken }),
    idToken: jwt({ iss: ISSUER }),
    expiresAt: Date.now() + 1000,
    user: USER,
  };
}

describe("PkceSessionStoreDriver", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("signs in with an S256 request, exchanges the code with the verifier and keeps the session", async () => {
    const { storage, browser, driver, tokens } = setup();
    const seen = stubProvider(() => tokens());
    await driver.signIn();

    const request = browser.request;
    expect(request?.href.split("?")[0]).toBe(DISCOVERY.authorization_endpoint);
    expect(request?.searchParams.get("response_type")).toBe("code");
    expect(request?.searchParams.get("client_id")).toBe(CLIENT_ID);
    expect(request?.searchParams.get("redirect_uri")).toBe("acme://auth/callback");
    expect(request?.searchParams.get("scope")).toBe("openid profile email offline_access");
    expect(request?.searchParams.get("code_challenge_method")).toBe("S256");

    const exchange = seen.find((entry) => entry.url === DISCOVERY.token_endpoint)?.form;
    expect(exchange?.get("grant_type")).toBe("authorization_code");
    expect(exchange?.get("code")).toBe("code-1");
    expect(exchange?.get("redirect_uri")).toBe("acme://auth/callback");
    expect(exchange?.get("client_id")).toBe(CLIENT_ID);
    expect(request?.searchParams.get("code_challenge")).toBe(
      await codeChallengeOf(exchange?.get("code_verifier") ?? ""),
    );

    expect(await driver.load()).toEqual(USER);
    expect(await driver.accessToken()).toBe("access-1");
    expect(storage.secrets.has("identity.session")).toBe(true);
  });

  it("adds a provider hint scope and a step-up to the authorization request", async () => {
    const { browser, driver, tokens } = setup();
    stubProvider(() => tokens());
    await driver.signIn({
      scopes: ["urn:zitadel:iam:org:idp:id:42", "openid"],
      forceLogin: true,
      maxAge: 0,
    });
    const request = browser.request;
    expect(request?.searchParams.get("scope")).toBe(
      "openid profile email offline_access urn:zitadel:iam:org:idp:id:42",
    );
    expect(request?.searchParams.get("prompt")).toBe("login");
    expect(request?.searchParams.get("max_age")).toBe("0");
  });

  it("cancels when the browser is closed or the user declines", async () => {
    const { browser, driver, tokens } = setup();
    stubProvider(() => tokens());
    browser.answer = () => null;
    await expect(driver.signIn()).rejects.toBeInstanceOf(SignInCancelledError);
    browser.answer = (_request, redirectUri) => `${redirectUri}?error=access_denied`;
    await expect(driver.signIn()).rejects.toBeInstanceOf(SignInCancelledError);
  });

  it("refuses a callback with another state, and keeps nothing", async () => {
    const { storage, browser, driver, tokens } = setup();
    stubProvider(() => tokens());
    browser.answer = (_request, redirectUri) => `${redirectUri}?code=code-1&state=forged`;
    await expect(driver.signIn()).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(storage.secrets.has("identity.session")).toBe(false);
  });

  it.each([
    ["another issuer", { iss: "https://evil.example" }],
    ["another audience", { aud: ["someone-else"] }],
    ["another nonce", { nonce: "replayed" }],
    ["an expired token", { exp: Math.floor(Date.now() / 1000) - 10 }],
  ])("refuses an ID token with %s", async (_case, claims) => {
    const { storage, driver, tokens } = setup();
    stubProvider(() => tokens(claims));
    await expect(driver.signIn()).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(storage.secrets.has("identity.session")).toBe(false);
  });

  it("refuses a code the provider rejects as a failed sign-in, not a revoked session", async () => {
    const { driver } = setup();
    stubProvider(() => Response.json({ error: "invalid_grant" }, { status: 400 }));
    await expect(driver.signIn()).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("renews an expiring token once, rotating the refresh token and keeping the user", async () => {
    const { storage, driver } = setup();
    storage.secrets.set("identity.session", expiring());
    const seen = stubProvider(() =>
      Response.json({
        access_token: "access-2",
        token_type: "Bearer",
        expires_in: 600,
        refresh_token: "refresh-2",
      }),
    );
    const [first, second] = await Promise.all([driver.accessToken(), driver.accessToken()]);
    expect([first, second]).toEqual(["access-2", "access-2"]);
    const renewals = seen.filter((entry) => entry.url === DISCOVERY.token_endpoint);
    expect(renewals).toHaveLength(1);
    expect(renewals[0]?.form?.get("grant_type")).toBe("refresh_token");
    expect(renewals[0]?.form?.get("refresh_token")).toBe("refresh-0");
    expect(storage.secrets.get("identity.session")).toMatchObject({
      accessToken: "access-2",
      refreshToken: "refresh-2",
    });
    expect(await driver.load()).toEqual(USER);
  });

  it("drops the tokens and refuses session_revoked when the provider refuses the refresh token", async () => {
    const { storage, driver } = setup();
    storage.secrets.set("identity.session", expiring());
    stubProvider(() => Response.json({ error: "invalid_grant" }, { status: 400 }));
    await expect(driver.load()).rejects.toBeInstanceOf(SessionRevokedError);
    expect(storage.secrets.has("identity.session")).toBe(false);
  });

  it("refuses session_revoked when an expiring session has no refresh token", async () => {
    const { storage, driver } = setup();
    storage.secrets.set("identity.session", expiring(undefined));
    stubProvider(() => new Response(null, { status: 500 }));
    await expect(driver.accessToken()).rejects.toBeInstanceOf(SessionRevokedError);
  });

  it("keeps the session through a provider outage", async () => {
    const { storage, driver } = setup();
    storage.secrets.set("identity.session", expiring());
    stubProvider(() => new Response(null, { status: 503 }));
    expect(await driver.load()).toEqual(USER);
    expect(await driver.accessToken()).toBe("access-0");
  });

  it("signs out: drops the tokens, then revokes the refresh token", async () => {
    const { storage, driver } = setup();
    storage.secrets.set("identity.session", expiring());
    const seen = stubProvider(() => new Response(null, { status: 500 }));
    await driver.signOut();
    expect(storage.secrets.has("identity.session")).toBe(false);
    const revocation = seen.find((entry) => entry.url === DISCOVERY.revocation_endpoint)?.form;
    expect(revocation?.get("token")).toBe("refresh-0");
    expect(revocation?.get("token_type_hint")).toBe("refresh_token");
    expect(revocation?.get("client_id")).toBe(CLIENT_ID);
  });

  it("is signed out with nothing kept", async () => {
    const { driver } = setup();
    expect(await driver.load()).toBeNull();
    expect(await driver.accessToken()).toBeUndefined();
  });

  it("refuses a discovery document of another issuer", async () => {
    const { driver } = setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ ...DISCOVERY, issuer: "https://evil.example" })),
    );
    await expect(driver.signIn()).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("refuses an unreadable discovery document, and tries again on the next call", async () => {
    const { driver, tokens } = setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 502 })),
    );
    await expect(driver.signIn()).rejects.toBeInstanceOf(TransportError);
    stubProvider(() => tokens());
    await expect(driver.signIn()).resolves.toBeUndefined();
  });

  it("needs the issuer and the client id", async () => {
    await expect(setup({ issuer: "" }).driver.signIn()).rejects.toThrow(/issuer/);
    stubProvider(() => new Response(null, { status: 500 }));
    await expect(setup({ clientId: "" }).driver.signIn()).rejects.toThrow(/clientId/);
  });
});
