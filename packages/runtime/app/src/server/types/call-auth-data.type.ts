/**
 * Stackra file contract:
 * Purpose: `CallAuthData`, what `CallAuthenticator` answers for a verified call and the generated Encore auth handler
 *          returns as its auth data: Encore's `userID` and the typed `Actor` the endpoints read (`getAuthData()`), and
 *          for an API key the call options its key sets.
 * Boundary: a type only. `userID` is the actor's public id, never the provider's subject.
 * Runtime: node
 * Governing contract: ADR 0098 (the actor from the credential); ADR 0209 (decision 3).
 */
import type { Actor } from "@stackra/contracts";

import type { KeyCallOptions } from "#server/types/key-call-options.type";

/** The verified caller of one call. */
export interface CallAuthData {
  /** The actor's public id (`usr_…`, `svc_…`), Encore's user id. */
  readonly userID: string;

  /** The verified actor the call runs as: a user, a service, or an API key's principal (`api_client`). */
  readonly actor: Actor;

  /** An API key's call options (credential, origin, sandbox); absent for a token. */
  readonly call?: KeyCallOptions;
}
