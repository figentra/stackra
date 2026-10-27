/**
 * Stackra file contract:
 * Purpose: `BffSessionStoreDriver`, the `SessionStore` of the web and the PWA: the BFF holds the tokens and the browser
 *          an HttpOnly cookie, so this driver asks the BFF who is signed in (`GET <bff>/session`), leaves for its
 *          login (`<bff>/login?returnTo=…`) and ends the session there (`POST <bff>/logout`).
 * Boundary: no token ever reaches JavaScript: `accessToken()` is `undefined` and every request carries the cookie
 *           (`credentials: "include"`) and the CSRF header `IdentityConfig.csrfHeader` (`x-stackra-csrf`, equal to the
 *           API's `CsrfConfig.headerName`), which @stackra/app's `CsrfGuard` requires on a cookie-bearing POST
 *           (custom-header mode: a cross-origin page cannot set it, STA-1374). The BFF is mounted at `IdentityConfig.bffEndpoint` on the API origin
 *           (`ClientsConfig.baseUrl`). A 401 is "signed out"; another failure, or an answer that is not a session, is a
 *           `TransportError`, so the `SessionService` boots signed out and reports it. `returnTo` is the in-app path
 *           the browser was on, and the BFF re-checks it.
 * Runtime: browser
 * Governing contract: ADR 0206 (decision 8); ADR 0241 (decision 2); ADR 0237 (the BFF behind the gateway); ADR 0142;
 *                     ADR 0437 (CSRF), STA-1385.
 */
import type { ClientsConfig } from "@stackra/clients";
import { TransportError } from "@stackra/clients";
import { TransportFailure } from "@stackra/clients/contracts";
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { createTransport, timeout } from "@stackra/transport";
import type { Transport } from "@stackra/transport";
import { z } from "zod";

import type { IdentityConfig } from "#config/identity.config";
import { SessionStore } from "#contracts/ports/session-store.port";
import type { SessionUser } from "#contracts/types/session-user.type";
import type { SignInOptions } from "#contracts/types/sign-in-options.type";
import { SESSION_USER_SCHEMA } from "#core/constants/session-user-schema.constant";
import { signInParams } from "#core/functions/sign-in-params.function";

/** The session endpoint's answer: the user, or `null` when signed out. */
const BFF_SESSION = z.object({ user: SESSION_USER_SCHEMA }).nullable();

/**
 * The BFF cookie session.
 *
 * @example
 * const store = new BffSessionStoreDriver(identityConfig, clientsConfig);
 * await store.load(); // the user, or null
 * store.loginUrl("/settings"); // "https://api.acme.example/api/auth/login?returnTo=%2Fsettings"
 */
export class BffSessionStoreDriver extends Driver(SessionStore) {
  /** The BFF mount. */
  private readonly config: IdentityConfig;

  /** The API origin and the timeout. */
  private readonly clients: ClientsConfig;

  /** The transport every BFF request goes through. */
  private readonly send: Transport;

  /**
   * @param config - the BFF mount.
   * @param clients - the API origin the BFF is mounted on, and the request timeout.
   */
  constructor(config: IdentityConfig, clients: ClientsConfig) {
    super();
    this.config = config;
    this.clients = clients;
    this.send = createTransport({
      middleware: [timeout(Duration.seconds(clients.timeoutSeconds))],
    });
  }

  /** The BFF login URL that comes back to `returnTo`, an in-app path. */
  loginUrl(returnTo: string, options: SignInOptions = {}): string {
    const params = new URLSearchParams({ returnTo, ...signInParams(options) });
    if (options.scopes !== undefined && options.scopes.length > 0)
      params.set("scope", options.scopes.join(" "));
    return `${this.endpoint("login")}?${params.toString()}`;
  }

  /**
   * The user the cookie belongs to, or `null` when signed out.
   *
   * @throws TransportError when the BFF fails or answers something that is not a session.
   */
  async load(): Promise<SessionUser | null> {
    const response = await this.send(this.request("session", "GET"));
    if (response.status === 401) return null;
    const failed = { reason: TransportFailure.Response, status: response.status };
    if (!response.ok) throw TransportError.create(failed);
    const parsed = BFF_SESSION.safeParse(await response.json().catch(() => undefined));
    if (!parsed.success) throw TransportError.create(failed, { cause: parsed.error });
    return parsed.data?.user ?? null;
  }

  /**
   * Leaves for the BFF login, which sends the browser to the hosted sign-in and back to the current path.
   *
   * @throws TypeError outside a browser, where there is no page to leave.
   */
  async signIn(options: SignInOptions = {}): Promise<void> {
    if (typeof location === "undefined")
      throw new TypeError("The BFF flow signs in from a browser page");
    location.assign(
      this.loginUrl(`${location.pathname}${location.search}${location.hash}`, options),
    );
    // The page unloads for the hosted sign-in, so this never settles.
    return new Promise<void>(() => undefined);
  }

  /**
   * Ends the session at the BFF; a 401 means it had already ended.
   *
   * @throws TransportError when the BFF fails.
   */
  async signOut(): Promise<void> {
    const response = await this.send(this.request("logout", "POST"));
    if (!response.ok && response.status !== 401)
      throw TransportError.create({ reason: TransportFailure.Response, status: response.status });
  }

  /** The cookie is the credential, so no token is sent. */
  async accessToken(): Promise<string | undefined> {
    return undefined;
  }

  /** The URL of one BFF route. */
  private endpoint(route: string): string {
    return `${this.clients.baseUrl.replace(/\/$/, "")}${this.config.bffEndpoint}/${route}`;
  }

  /** A request to one BFF route that carries the cookie and the CSRF header. */
  private request(route: string, method: "GET" | "POST"): Request {
    return new Request(this.endpoint(route), {
      method,
      credentials: "include",
      // Custom-header mode: the guard checks presence; a cross-origin page cannot add it without a preflight.
      headers: { accept: "application/json", [this.config.csrfHeader]: "1" },
    });
  }
}
