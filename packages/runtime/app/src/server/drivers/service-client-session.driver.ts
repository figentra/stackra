/**
 * Stackra file contract:
 * Purpose: `ServiceClientSessionDriver` (`service`), the `ClientSession` of a service's generated clients: every
 *          service-to-service call sends `Authorization: Bearer` with this service's own token for the producer's
 *          audience (`ServiceTokens`, the audience from `ClientsConfig.audiences` by the call's module) and, when the
 *          running call holds a user's token it may forward (`holdCallerToken`), that token in `Stackra-On-Behalf-Of`.
 *          With none held no such header goes out, and the producer runs the call as this service alone.
 * Boundary: a singleton that reads the held token at send time from `ON_BEHALF_OF_TOKEN`, so it never keeps one. A
 *           module with no configured audience throws a `TypeError` naming the module before any token is asked for;
 *           a token is never logged or put in an error. `can` is false: a service session holds no user permission,
 *           and the producer's pipeline checks every call anyway.
 * Runtime: node
 * Governing contract: ADR 0209 (decision 3 and its 2026-11-07 amendment, points 1 and 2); ADR 0260 (decision 3: the
 *                     session's headers); STA-2558.
 */
import type { ClientsConfig } from "@stackra/clients";
import { ClientSession } from "@stackra/clients/contracts";
import type { ClientRequest } from "@stackra/clients/contracts";
import { Driver } from "@stackra/container";
import type { ServiceTokens } from "@stackra/identity/contracts";

import { ON_BEHALF_OF_TOKEN } from "#server/constants/on-behalf-of-token.constant";

/**
 * A service's session for its outgoing calls.
 *
 * @example
 * // clients.audiences = { pay: "<pay's project id>" }
 * await session.headers(payRequest); // { Authorization: "Bearer …", "Stackra-On-Behalf-Of": "…" }
 */
export class ServiceClientSessionDriver extends Driver(ClientSession) {
  /** This service's tokens. */
  private readonly tokens: ServiceTokens;

  /** The audience per producer module. */
  private readonly config: ClientsConfig;

  /**
   * @param tokens - this service's token source.
   * @param config - the generated clients' configuration, with `audiences`.
   */
  constructor(tokens: ServiceTokens, config: ClientsConfig) {
    super();
    this.tokens = tokens;
    this.config = config;
  }

  /**
   * The service token for `request`'s producer, and the user's token the running call may forward.
   *
   * @throws TypeError when no request is given or its module has no configured audience.
   */
  async headers(request?: ClientRequest): Promise<Readonly<Record<string, string>>> {
    if (request === undefined)
      throw new TypeError("a service's session needs the call to pick its producer's audience");
    const module = request.key.split(".", 1)[0] ?? "";
    // Own keys only, so a key like `constructor.x.y@1` never reads an inherited property.
    const audience = Object.hasOwn(this.config.audiences, module)
      ? this.config.audiences[module]
      : undefined;
    if (audience === undefined)
      throw new TypeError(`no audience is configured for module ${module} (clients.audiences)`);
    const token = await this.tokens.for(audience);
    const user = ON_BEHALF_OF_TOKEN.getStore()?.();
    return {
      Authorization: `Bearer ${token}`,
      ...(user === undefined ? {} : { "Stackra-On-Behalf-Of": user }),
    };
  }

  /** A service session holds no user permission. */
  can(): boolean {
    return false;
  }
}
