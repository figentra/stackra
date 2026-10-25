/**
 * Stackra file contract:
 * Purpose: `PkceSessionStoreDriver`, the `SessionStore` of desktop and mobile: the OIDC authorization-code flow with
 *          PKCE (`S256`) in the system browser against the provider the issuer names, the tokens kept in the `secrets`
 *          storage area, the access token renewed a minute before it expires with the refresh token rotated.
 * Boundary: a public client: the client id and the issuer are public values and no secret exists. The endpoints come
 *           from the issuer's discovery document, whose `issuer` must equal the configured one. A callback without the
 *           sent state or a code is refused, and so is an ID token whose issuer, audience, expiry or nonce is wrong
 *           (received from the token endpoint over TLS, so its signature is not checked, OpenID Connect Core
 *           3.1.3.7). `invalid_grant` on renewal drops the tokens and refuses `session_revoked`; any other failure to
 *           renew keeps the session as it is, so a signed-in device keeps working through a provider outage (ADR 0206
 *           decision 9) and the API judges the token. Sign-out revokes the refresh token at the provider as a best
 *           effort, after the tokens are gone here. Needs WebCrypto (`crypto.getRandomValues`, `crypto.subtle`).
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decisions 8 and 9); ADR 0241 (decision 4); ADR 0277 (decisions 1, 3, 4 and 6); ADR
 *                     0338 (decision 4); RFC 7636; RFC 7009; OpenID Connect Core and Discovery.
 */
import { TransportError } from "@stackra/clients";
import { TransportFailure } from "@stackra/clients/contracts";
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { UnauthenticatedError } from "@stackra/errors";
import { Storage } from "@stackra/storage/contracts";
import { createTransport, timeout } from "@stackra/transport";
import { url } from "@stackra/validation";
import { z } from "zod";

import { IdentityConfig } from "#config/identity.config";
import { SessionStore } from "#contracts/ports/session-store.port";
import { SignInBrowser } from "#contracts/ports/sign-in-browser.port";
import type { SessionUser } from "#contracts/types/session-user.type";
import { SESSION_USER_SCHEMA } from "#core/constants/session-user-schema.constant";
import { SessionRevokedError } from "#core/errors/session-revoked.error";
import { SignInCancelledError } from "#core/errors/sign-in-cancelled.error";
import { codeChallengeOf } from "#core/functions/code-challenge-of.function";
import { jwtClaimsOf } from "#core/functions/jwt-claims-of.function";
import { randomToken } from "#core/functions/random-token.function";
import { sessionUserOf } from "#core/functions/session-user-of.function";

/** Where the tokens live in the `secrets` area. */
const SESSION_KEY = "identity.session";

/** Renew this long before the access token expires, so no call goes out with one about to lapse. */
const RENEW_EARLY_MS = 60_000;

/** The discovery fields this flow uses. */
const DISCOVERY = z.object({
  issuer: z.string(),
  authorization_endpoint: url(),
  token_endpoint: url(),
  revocation_endpoint: url().optional(),
});

/** A successful token answer (RFC 6749 section 5.1). */
const TOKENS = z.object({
  access_token: z.string().min(1),
  token_type: z.string().regex(/^bearer$/i),
  expires_in: z.number().positive(),
  refresh_token: z.string().min(1).optional(),
  id_token: z.string().min(1).optional(),
});

/** A refused token request (RFC 6749 section 5.2). */
const TOKEN_ERROR = z.object({ error: z.string() });

/** What a device keeps: the tokens, when the access token expires, and the user. */
const STORED = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).exactOptional(),
  idToken: z.string().min(1),
  expiresAt: z.number(),
  user: SESSION_USER_SCHEMA,
});

/** The provider's endpoints. */
type Endpoints = z.output<typeof DISCOVERY>;

/** A token answer. */
type Tokens = z.output<typeof TOKENS>;

/** A kept session; its user is read back through the schema, then held as the port's `SessionUser`. */
type Stored = Omit<z.output<typeof STORED>, "user"> & { readonly user: SessionUser };

/** The form headers of a token or revocation request. */
const FORM_HEADERS = {
  "content-type": "application/x-www-form-urlencoded",
  accept: "application/json",
};

/**
 * The PKCE session.
 *
 * @example
 * const store = new PkceSessionStoreDriver(identityConfig, storage, browser);
 * await store.signIn(); // opens the hosted sign-in, keeps the tokens
 * await store.accessToken(); // renewed when it is about to expire
 */
export class PkceSessionStoreDriver extends Driver(SessionStore) {
  /** The issuer, the client id, the scopes and the redirect path. */
  private readonly config: IdentityConfig;

  /** Where the tokens are kept. */
  private readonly storage: Storage;

  /** Opens the hosted sign-in. */
  private readonly browser: SignInBrowser;

  /** The transport every provider request goes through. */
  private readonly send = createTransport({ middleware: [timeout(Duration.seconds(30))] });

  /** The discovered endpoints, read once. */
  private discovered: Promise<Endpoints> | undefined;

  /** The renewal in flight, shared by every caller that needs the token meanwhile. */
  private renewing: Promise<Stored | null> | undefined;

  /**
   * @param config - the issuer, the public client id, the scopes and the redirect path.
   * @param storage - client storage; the tokens go to its `secrets` area.
   * @param browser - the platform's system browser.
   */
  constructor(config: IdentityConfig, storage: Storage, browser: SignInBrowser) {
    super();
    this.config = config;
    this.storage = storage;
    this.browser = browser;
  }

  /**
   * The signed-in user, or `null` when no tokens are kept.
   *
   * @throws SessionRevokedError when the provider refused the renewal.
   */
  async load(): Promise<SessionUser | null> {
    return (await this.current())?.user ?? null;
  }

  /**
   * The access token, renewed when it is about to expire; `undefined` when signed out.
   *
   * @throws SessionRevokedError when the provider refused the renewal.
   */
  async accessToken(): Promise<string | undefined> {
    return (await this.current())?.accessToken;
  }

  /**
   * Runs the hosted sign-in and keeps the tokens.
   *
   * @throws SignInCancelledError when the user closed the browser or declined at the provider.
   * @throws UnauthenticatedError when the callback or the ID token fails a check.
   * @throws TransportError when the provider cannot be reached or answers something unreadable.
   */
  async signIn(): Promise<void> {
    const endpoints = await this.endpoints();
    const redirectUri = this.browser.redirectUri(this.config.nativeRedirectPath);
    const verifier = randomToken();
    const state = randomToken();
    const nonce = randomToken();
    const authorize = new URL(endpoints.authorization_endpoint);
    authorize.search = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId(),
      redirect_uri: redirectUri,
      scope: this.config.scopes.join(" "),
      state,
      nonce,
      code_challenge: await codeChallengeOf(verifier),
      code_challenge_method: "S256",
    }).toString();
    const callback = await this.browser.authorize(authorize.toString(), redirectUri);
    if (callback === null) throw SignInCancelledError.create();
    const answer = new URL(callback).searchParams;
    if (answer.get("error") === "access_denied") throw SignInCancelledError.create();
    const code = answer.get("code");
    if (answer.get("state") !== state || code === null) throw UnauthenticatedError.create();
    const tokens = await this.token(endpoints, {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }).catch((error: unknown) => {
      // A refused code is a failed sign-in, not a revoked session.
      throw error instanceof SessionRevokedError
        ? UnauthenticatedError.create({}, { cause: error })
        : error;
    });
    this.keep(tokens, endpoints, nonce, undefined);
  }

  /** Drops the tokens, then revokes the refresh token at the provider when it can (best effort). */
  async signOut(): Promise<void> {
    const stored = this.read();
    this.storage.secrets.delete(SESSION_KEY);
    if (stored?.refreshToken === undefined) return;
    const endpoints = await this.endpoints().catch(() => undefined);
    if (endpoints?.revocation_endpoint === undefined) return;
    await this.send(
      new Request(endpoints.revocation_endpoint, {
        method: "POST",
        headers: FORM_HEADERS,
        body: new URLSearchParams({
          token: stored.refreshToken,
          token_type_hint: "refresh_token",
          client_id: this.clientId(),
        }),
      }),
    ).catch(() => undefined);
  }

  /** The kept session, renewed first when its access token is about to expire. */
  private async current(): Promise<Stored | null> {
    const stored = this.read();
    if (stored === null || stored.expiresAt - RENEW_EARLY_MS > Date.now()) return stored;
    this.renewing ??= this.renew(stored).finally(() => {
      this.renewing = undefined;
    });
    return this.renewing;
  }

  /** Renews with the refresh token; keeps the session as it is when the provider cannot answer. */
  private async renew(stored: Stored): Promise<Stored | null> {
    if (stored.refreshToken === undefined) {
      this.storage.secrets.delete(SESSION_KEY);
      throw SessionRevokedError.create();
    }
    try {
      const endpoints = await this.endpoints();
      const tokens = await this.token(endpoints, {
        grant_type: "refresh_token",
        refresh_token: stored.refreshToken,
      });
      return this.keep(tokens, endpoints, undefined, stored);
    } catch (error) {
      if (!(error instanceof SessionRevokedError)) return stored;
      this.storage.secrets.delete(SESSION_KEY);
      throw error;
    }
  }

  /**
   * Checks a token answer's ID token, maps its claims and keeps the session; a renewal without an ID token keeps the
   * user it had.
   */
  private keep(
    tokens: Tokens,
    endpoints: Endpoints,
    nonce: string | undefined,
    previous: Stored | undefined,
  ): Stored {
    let user: SessionUser | undefined = previous?.user;
    if (tokens.id_token !== undefined) {
      const claims = jwtClaimsOf(tokens.id_token);
      const audiences: unknown[] = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
      const isValid =
        claims.iss === endpoints.issuer &&
        audiences.includes(this.clientId()) &&
        typeof claims.exp === "number" &&
        claims.exp * 1000 > Date.now() &&
        (nonce === undefined || claims.nonce === nonce);
      if (!isValid) throw UnauthenticatedError.create();
      user = sessionUserOf(claims);
    }
    const idToken = tokens.id_token ?? previous?.idToken;
    if (user === undefined || idToken === undefined) throw UnauthenticatedError.create();
    const refreshToken = tokens.refresh_token ?? previous?.refreshToken;
    const stored: Stored = {
      accessToken: tokens.access_token,
      ...(refreshToken === undefined ? {} : { refreshToken }),
      idToken,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      user,
    };
    this.storage.secrets.set(SESSION_KEY, stored);
    return stored;
  }

  /**
   * Posts one grant to the token endpoint.
   *
   * @throws SessionRevokedError on `invalid_grant`.
   * @throws TransportError on any other refusal or an unreadable answer.
   */
  private async token(endpoints: Endpoints, grant: Record<string, string>): Promise<Tokens> {
    const response = await this.send(
      new Request(endpoints.token_endpoint, {
        method: "POST",
        headers: FORM_HEADERS,
        body: new URLSearchParams({ ...grant, client_id: this.clientId() }),
      }),
    );
    const body: unknown = await response.json().catch(() => undefined);
    const failed = { reason: TransportFailure.Response, status: response.status };
    if (!response.ok) {
      if (TOKEN_ERROR.safeParse(body).data?.error === "invalid_grant")
        throw SessionRevokedError.create();
      throw TransportError.create(failed);
    }
    const parsed = TOKENS.safeParse(body);
    if (!parsed.success) throw TransportError.create(failed, { cause: parsed.error });
    return parsed.data;
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
   * @throws TransportError when the document cannot be read.
   * @throws UnauthenticatedError when the document names another issuer.
   */
  private async discover(): Promise<Endpoints> {
    const { issuer } = this.config;
    if (issuer === "")
      throw new TypeError("IdentityConfig.issuer is not set: a PKCE client discovers its provider");
    const response = await this.send(
      new Request(`${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`, {
        headers: { accept: "application/json" },
      }),
    );
    const body: unknown = response.ok ? await response.json().catch(() => undefined) : undefined;
    const parsed = DISCOVERY.safeParse(body);
    if (!parsed.success)
      throw TransportError.create(
        { reason: TransportFailure.Response, status: response.status },
        { cause: parsed.error },
      );
    if (parsed.data.issuer !== issuer) throw UnauthenticatedError.create();
    return parsed.data;
  }

  /** The kept session, or `null` when none is kept or it no longer reads. */
  private read(): Stored | null {
    const parsed = STORED.safeParse(this.storage.secrets.get(SESSION_KEY));
    return parsed.success ? parsed.data : null;
  }

  /**
   * The public client id.
   *
   * @throws TypeError when `IdentityConfig.clientId` is not set.
   */
  private clientId(): string {
    if (this.config.clientId === "")
      throw new TypeError("IdentityConfig.clientId is not set: a PKCE client presents it");
    return this.config.clientId;
  }
}
