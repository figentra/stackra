/**
 * Stackra file contract:
 * Purpose: `BffService`, the server half of `BffSessionStoreDriver`: the four BFF routes under
 *          `IdentityConfig.bffEndpoint`. `GET login` starts the OIDC authorization-code flow with PKCE (`S256`)
 *          against the issuer and keeps the state, nonce, verifier and return URL in a sealed, short-lived sign-in
 *          cookie; `GET callback` checks the state, exchanges the code, checks the ID token and sets the session
 *          cookie; `GET session` answers `{ user }` or 401 (`sessionOf`, public, is the same read for a host's
 *          raw endpoint that needs the caller); `POST logout` ends the provider session through
 *          `IdpAdmin.endSession`, clears the cookie and answers `{ redirectTo }`, the provider's end-session URL.
 * Boundary: no token leaves the server and none is kept: the session cookie holds the user and the provider session id
 *           (`sid`), sealed with AES-GCM under `BffConfig.cookieKey` (WebCrypto) with the cookie's name as associated
 *           data, so one cookie cannot stand in for the other. Both cookies are `__Host-`, `HttpOnly; Secure;
 *           SameSite=Lax; Path=/`. A return URL is an in-app path (resolved on the first return origin) or a URL on
 *           a `BffConfig.returnOrigins` origin (`isOriginAllowed`); anything else is refused, never followed. A
 *           callback without the sign-in cookie, with another state, without a code, with a code the provider
 *           refuses (a replay is `invalid_grant`), or with an ID token whose issuer, audience, expiry, nonce or `sid`
 *           is wrong goes back to the return URL with `sign_in_error=1` and no session. The ID token comes straight
 *           from the token endpoint over TLS, so its signature is not checked (OpenID Connect Core 3.1.3.7, as
 *           `PkceSessionStoreDriver`). Logout requires the CSRF header `IdentityConfig.csrfHeader` (the host's
 *           `CsrfGuard` and `OriginGuard` run first; this is the same rule kept here); a failed `endSession` throws
 *           and keeps the cookie, so the sign-out can be tried again. The host serves it from a raw endpoint:
 *           `extends Controller({ path: "/api/auth/*" })` whose `handle` calls this one (identity cannot import
 *           @stackra/app, which depends on it).
 * Runtime: node
 * Governing contract: ADR 0206 (decision 8); ADR 0241 (decision 2); ADR 0237 (the BFF behind the gateway); ADR 0437
 *                     (CSRF); RFC 6749; RFC 7636; RFC 6265bis (`__Host-`); OpenID Connect Core, Discovery and
 *                     RP-Initiated Logout; launch lessons 2026-10-24 section 5 (server-side sign-out); STA-1566.
 */
import { Service } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { createTransport, timeout } from "@stackra/transport";
import { url } from "@stackra/validation";
import { z } from "zod";
import type { ZodType } from "zod";

import type { BffConfig } from "#config/bff.config";
import type { IdentityConfig } from "#config/identity.config";
import type { IdpAdmin, SessionUser } from "#contracts/index";
import { SESSION_USER_SCHEMA } from "#core/constants/session-user-schema.constant";
import { base64UrlOf } from "#core/functions/base64-url-of.function";
import { codeChallengeOf } from "#core/functions/code-challenge-of.function";
import { isOriginAllowed } from "#core/functions/is-origin-allowed.function";
import { jwtClaimsOf } from "#core/functions/jwt-claims-of.function";
import { randomToken } from "#core/functions/random-token.function";
import { sessionUserOf } from "#core/functions/session-user-of.function";

/** The discovery fields the BFF uses. */
const DISCOVERY = z.object({
  issuer: z.string(),
  authorization_endpoint: url(),
  token_endpoint: url(),
  end_session_endpoint: url().optional(),
});

/** A successful code exchange; the ID token is required here. */
const TOKENS = z.object({ id_token: z.string().min(1) });

/** The sign-in attempt the sign-in cookie seals. */
const FLOW = z.object({
  state: z.string().min(1),
  nonce: z.string().min(1),
  verifier: z.string().min(1),
  returnTo: z.string().min(1),
  exp: z.number(),
});

/** The session the session cookie seals. */
const SESSION = z.object({ user: SESSION_USER_SCHEMA, sid: z.string().min(1), exp: z.number() });

/** The sign-in request parameters a login link may pass on to the provider. */
const PASSED_ON = ["acr_values", "max_age", "prompt"] as const;

/** The provider's endpoints. */
type Endpoints = z.output<typeof DISCOVERY>;

/** Every answer is per user and never cached (http-conventions rule 22). */
const NO_STORE = { "cache-control": "private, no-store" };

/** The value of cookie `name` in a `Cookie` header, or `undefined`. */
function cookieValue(header: string, name: string): string | undefined {
  for (const pair of header.split(";")) {
    const at = pair.indexOf("=");
    if (at > 0 && pair.slice(0, at).trim() === name) return pair.slice(at + 1).trim();
  }
  return undefined;
}

/** The bytes of a base64url text. */
function bytesOf(text: string): Uint8Array {
  return Uint8Array.from(
    atob(text.replaceAll("-", "+").replaceAll("_", "/")),
    // oxlint-disable-next-line unicorn/prefer-code-point -- a binary string: every character is one byte
    (char) => char.charCodeAt(0),
  );
}

/**
 * The BFF sign-in routes.
 *
 * @example
 * export class AuthController extends Controller({ path: "/api/auth/*" }) {
 *   constructor(private readonly bff: BffService) { super(); }
 *   handle(request: Request): Promise<Response> { return this.bff.handle(request); }
 * }
 */
export class BffService extends Service {
  /** The issuer, the client id, the scopes, the mount and the CSRF header. */
  private readonly identity: IdentityConfig;

  /** The secret, the cookie key and name, the URLs and the lifetimes. */
  private readonly config: BffConfig;

  /** Ends the provider session on sign-out. */
  private readonly idp: IdpAdmin;

  /** The transport every provider request goes through. */
  private readonly send = createTransport({ middleware: [timeout(Duration.seconds(30))] });

  /** The discovered endpoints, read once. */
  private discovered: Promise<Endpoints> | undefined;

  /** The cookie sealing key, derived once. */
  private sealing: Promise<CryptoKey> | undefined;

  /**
   * @param identity - the issuer, the client id, the scopes, the BFF mount and the CSRF header.
   * @param config - the BFF's secret, cookie key and name, URLs and lifetimes.
   * @param idp - ends the provider session on sign-out.
   */
  constructor(identity: IdentityConfig, config: BffConfig, idp: IdpAdmin) {
    super();
    this.identity = identity;
    this.config = config;
    this.idp = idp;
  }

  /** Answers one request under the BFF mount: `login`, `callback`, `session` or `logout`. */
  async handle(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);
    const route = pathname.slice(pathname.lastIndexOf("/") + 1);
    const method = request.method.toUpperCase();
    if (route === "logout") return method === "POST" ? this.logout(request) : this.status(405);
    if (method !== "GET") return this.status(405);
    if (route === "login") return this.login(request);
    if (route === "callback") return this.callback(request);
    if (route === "session") return this.session(request);
    return this.status(404);
  }

  /**
   * Sends the browser to the provider's sign-in with a fresh state, nonce and PKCE verifier.
   *
   * @throws TypeError when the issuer, client id, redirect URI, return origins or cookie key are not set.
   */
  async login(request: Request): Promise<Response> {
    const query = new URL(request.url).searchParams;
    const returnTo = this.returnUrl(query.get("returnTo") ?? "/");
    if (returnTo === undefined) return this.status(400);
    const endpoints = await this.endpoints();
    const flow = { state: randomToken(), nonce: randomToken(), verifier: randomToken(), returnTo };
    const extra = (query.get("scope") ?? "").split(" ").filter((scope) => scope !== "");
    const authorize = new URL(endpoints.authorization_endpoint);
    authorize.search = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId(),
      redirect_uri: this.redirectUri(),
      scope: [...new Set([...this.identity.scopes, ...extra])].join(" "),
      state: flow.state,
      nonce: flow.nonce,
      code_challenge: await codeChallengeOf(flow.verifier),
      code_challenge_method: "S256",
    }).toString();
    for (const name of PASSED_ON) {
      const value = query.get(name);
      if (value !== null) authorize.searchParams.set(name, value);
    }
    const minutes = this.config.flowMinutes;
    return this.redirect(authorize.toString(), [
      await this.seal(this.flowCookie(), flow, minutes * 60),
    ]);
  }

  /** Completes the sign-in: checks the callback and the ID token, sets the session cookie and returns to the app. */
  async callback(request: Request): Promise<Response> {
    const flow = await this.open(request, this.flowCookie(), FLOW);
    const clearFlow = this.clear(this.flowCookie());
    const fallback = this.returnUrl("/");
    const failed = (): Response => {
      const back = new URL(flow?.returnTo ?? fallback ?? "/", this.config.returnOrigins[0]);
      back.searchParams.set("sign_in_error", "1");
      return this.redirect(back.toString(), [clearFlow]);
    };
    const answer = new URL(request.url).searchParams;
    const code = answer.get("code");
    if (flow === undefined || code === null || answer.get("state") !== flow.state) return failed();
    const clientId = this.clientId();
    const redirectUri = this.redirectUri();
    try {
      const endpoints = await this.endpoints();
      const response = await this.send(
        new Request(endpoints.token_endpoint, {
          method: "POST",
          headers: this.tokenHeaders(),
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            code_verifier: flow.verifier,
            client_id: clientId,
          }),
        }),
      );
      // A refused code (a replay is `invalid_grant`) or an answer without an ID token is a failed sign-in.
      const tokens = response.ok
        ? TOKENS.safeParse(await response.json().catch(() => undefined))
        : undefined;
      if (tokens?.success !== true) return failed();
      const claims = jwtClaimsOf(tokens.data.id_token);
      const audiences: unknown[] = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
      const isValid =
        claims.iss === endpoints.issuer &&
        audiences.includes(clientId) &&
        typeof claims.exp === "number" &&
        claims.exp * 1000 > Date.now() &&
        claims.nonce === flow.nonce;
      const { sid } = claims;
      // The provider session id is what sign-out ends; a token without one cannot be signed out server-side.
      if (!isValid || typeof sid !== "string" || sid === "") return failed();
      const session = { user: sessionUserOf(claims), sid };
      const minutes = this.config.sessionMinutes;
      return this.redirect(flow.returnTo, [
        clearFlow,
        await this.seal(this.config.cookieName, session, minutes * 60),
      ]);
    } catch {
      // An unreadable ID token or user claims, or a provider outage, is a failed sign-in.
      return failed();
    }
  }

  /**
   * The session the request's cookie carries: its user and provider session id, or `undefined` when the cookie is
   * missing, forged or expired. A host's raw endpoint turns it into the call's `Actor`.
   *
   * @throws TypeError when the cookie key is not set.
   */
  async sessionOf(
    request: Request,
  ): Promise<{ readonly user: SessionUser; readonly sid: string } | undefined> {
    const session = await this.open(request, this.config.cookieName, SESSION);
    return session === undefined ? undefined : { user: session.user, sid: session.sid };
  }

  /** The signed-in user, or 401 when the cookie is missing, unreadable or expired. */
  async session(request: Request): Promise<Response> {
    const session = await this.sessionOf(request);
    if (session === undefined) return this.status(401);
    return Response.json({ user: session.user }, { headers: NO_STORE });
  }

  /**
   * Ends the session at the provider, clears the cookie and answers where the browser goes next.
   *
   * @throws IdpAdminUnavailableError when the provider cannot end the session; the cookie is kept.
   */
  async logout(request: Request): Promise<Response> {
    if ((request.headers.get(this.identity.csrfHeader) ?? "") === "") return this.status(403);
    const clearSession = this.clear(this.config.cookieName);
    const session = await this.sessionOf(request);
    if (session === undefined) return this.status(401, [clearSession]);
    await this.idp.endSession(session.sid);
    const after =
      this.config.postLogoutUri === "" ? this.returnUrl("/") : this.config.postLogoutUri;
    const endpoints = await this.endpoints().catch(() => undefined);
    let redirectTo = after ?? "/";
    if (endpoints?.end_session_endpoint !== undefined) {
      const end = new URL(endpoints.end_session_endpoint);
      end.searchParams.set("client_id", this.clientId());
      end.searchParams.set("post_logout_redirect_uri", redirectTo);
      redirectTo = end.toString();
    }
    const headers = new Headers(NO_STORE);
    headers.append("set-cookie", clearSession);
    return Response.json({ redirectTo }, { headers });
  }

  /** `returnTo` as an absolute URL on an allowed origin, or `undefined` when it points anywhere else. */
  private returnUrl(returnTo: string): string | undefined {
    const [home] = this.config.returnOrigins;
    if (home === undefined)
      throw new TypeError("BffConfig.returnOrigins is not set: a sign-in returns to an app origin");
    let target: URL;
    try {
      target = new URL(returnTo, home);
    } catch {
      return undefined;
    }
    return isOriginAllowed(target.origin, this.config.returnOrigins)
      ? target.toString()
      : undefined;
  }

  /** A 302 to `location` that sets `cookies`. */
  private redirect(location: string, cookies: readonly string[]): Response {
    const headers = new Headers({ ...NO_STORE, location });
    for (const cookie of cookies) headers.append("set-cookie", cookie);
    return new Response(null, { status: 302, headers });
  }

  /** An empty answer with `status` that sets `cookies`. */
  private status(status: number, cookies: readonly string[] = []): Response {
    const headers = new Headers(NO_STORE);
    for (const cookie of cookies) headers.append("set-cookie", cookie);
    return new Response(null, { status, headers });
  }

  /** The `Set-Cookie` value of `name` holding `value`, or clearing it when `maxAge` is 0. */
  private cookie(name: string, value: string, maxAge: number): string {
    return `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
  }

  /** The `Set-Cookie` value that clears `name`. */
  private clear(name: string): string {
    return this.cookie(name, "", 0);
  }

  /** The `Set-Cookie` value of `name` holding `value` sealed, lasting `maxAge` seconds. */
  private async seal(name: string, value: object, maxAge: number): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plain = new TextEncoder().encode(
      JSON.stringify({ ...value, exp: Date.now() + maxAge * 1000 }),
    );
    const sealed = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(name) },
        await this.key(),
        plain,
      ),
    );
    const bytes = new Uint8Array(iv.length + sealed.length);
    bytes.set(iv);
    bytes.set(sealed, iv.length);
    return this.cookie(name, base64UrlOf(bytes), maxAge);
  }

  /** The sealed cookie `name` of `request` read through `schema`, or `undefined` when absent, forged or expired. */
  private async open<T extends { readonly exp: number }>(
    request: Request,
    name: string,
    schema: ZodType<T>,
  ): Promise<T | undefined> {
    const text = cookieValue(request.headers.get("cookie") ?? "", name);
    if (text === undefined || text === "") return undefined;
    const key = await this.key();
    try {
      const bytes = bytesOf(text);
      const plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: bytes.slice(0, 12), additionalData: new TextEncoder().encode(name) },
        key,
        bytes.slice(12),
      );
      const parsed = schema.safeParse(JSON.parse(new TextDecoder().decode(plain)));
      return parsed.success && parsed.data.exp > Date.now() ? parsed.data : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * The AES-GCM key: SHA-256 of `BffConfig.cookieKey`.
   *
   * @throws TypeError when the cookie key is shorter than 32 characters.
   */
  private key(): Promise<CryptoKey> {
    const secret = this.config.cookieKey;
    if (secret.length < 32)
      throw new TypeError(
        "BffConfig.cookieKey is not set: IDENTITY_BFF_COOKIE_KEY seals the cookies",
      );
    this.sealing ??= crypto.subtle
      .digest("SHA-256", new TextEncoder().encode(secret))
      .then((raw) => crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]));
    return this.sealing;
  }

  /** The token request headers: a confidential client authenticates with HTTP Basic (RFC 6749 section 2.3.1). */
  private tokenHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    };
    if (this.config.clientSecret !== "") {
      const id = encodeURIComponent(this.clientId());
      headers.authorization = `Basic ${btoa(`${id}:${encodeURIComponent(this.config.clientSecret)}`)}`;
    }
    return headers;
  }

  /** The sign-in attempt's cookie name. */
  private flowCookie(): string {
    return `${this.config.cookieName}_flow`;
  }

  /**
   * The callback URL registered at the provider.
   *
   * @throws TypeError when `BffConfig.redirectUri` is not set.
   */
  private redirectUri(): string {
    if (this.config.redirectUri === "")
      throw new TypeError("BffConfig.redirectUri is not set: the provider returns there");
    return this.config.redirectUri;
  }

  /**
   * The client id.
   *
   * @throws TypeError when `IdentityConfig.clientId` is not set.
   */
  private clientId(): string {
    if (this.identity.clientId === "")
      throw new TypeError("IdentityConfig.clientId is not set: the BFF presents it");
    return this.identity.clientId;
  }

  /** The discovered endpoints; a failed discovery is tried again on the next call. */
  private endpoints(): Promise<Endpoints> {
    this.discovered ??= this.discover().catch((error: unknown) => {
      this.discovered = undefined;
      throw error;
    });
    return this.discovered;
  }

  /**
   * Reads the issuer's discovery document.
   *
   * @throws TypeError when `IdentityConfig.issuer` is not set.
   * @throws Error when the document cannot be read or names another issuer.
   */
  private async discover(): Promise<Endpoints> {
    const { issuer } = this.identity;
    if (issuer === "")
      throw new TypeError("IdentityConfig.issuer is not set: the BFF discovers its provider");
    const response = await this.send(
      new Request(`${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`, {
        headers: { accept: "application/json" },
      }),
    );
    const body: unknown = response.ok ? await response.json().catch(() => undefined) : undefined;
    const parsed = DISCOVERY.safeParse(body);
    if (!parsed.success || parsed.data.issuer !== issuer)
      throw new Error(`The issuer's discovery document is unreadable (status ${response.status})`);
    return parsed.data;
  }
}
