/**
 * Stackra file contract:
 * Purpose: `SessionClientSessionDriver`, the `ClientSession` the generated clients call with: the bearer token of a PKCE
 *          session and the active scope's path as `X-Scope-Path` on every call, and the session's permissions for
 *          presentation.
 * Boundary: the identity side of `@stackra/clients`' port (the clients package reads no token, cookie or claim). A BFF
 *           session sends no `Authorization` header (the cookie is the credential); with no active scope no scope
 *           header goes out, and the server resolves the scope from the token claim or the root. `can` hides a button
 *           only; the producer's pipeline still checks every call.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3); ADR 0206 (decision 2); ADR 0327 (decision 7: the one client header).
 */
import { ClientSession } from "@stackra/clients/contracts";
import { Driver } from "@stackra/container";
import { ActiveScopeService, SCOPE_PATH_HEADER } from "@stackra/scope";
import { TRANSPORT_HEADERS } from "@stackra/transport";

import { SessionService } from "#core/services/session.service";

/**
 * The session as calls need it.
 *
 * @example
 * const session = new SessionClientSessionDriver(sessionService, activeScope);
 * await session.headers(); // { Authorization: "Bearer …", "X-Scope-Path": "platform.acme" }
 */
export class SessionClientSessionDriver extends Driver(ClientSession) {
  /** The session the token and the permissions come from. */
  private readonly session: SessionService;

  /** The active scope the path comes from. */
  private readonly scope: ActiveScopeService;

  /**
   * @param session - the client's session.
   * @param scope - the client's active scope.
   */
  constructor(session: SessionService, scope: ActiveScopeService) {
    super();
    this.session = session;
    this.scope = scope;
  }

  /** The credential and the scope of the next call. */
  async headers(): Promise<Readonly<Record<string, string>>> {
    const token = await this.session.accessToken();
    const path = this.scope.current()?.path;
    return {
      ...(token === undefined ? {} : { [TRANSPORT_HEADERS.authorization]: `Bearer ${token}` }),
      ...(path === undefined ? {} : { [SCOPE_PATH_HEADER]: path }),
    };
  }

  /** Whether the signed-in user holds `permission`; `false` when signed out. */
  can(permission: string): boolean {
    return this.session.user?.permissions.includes(permission) ?? false;
  }
}
