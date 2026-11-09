/**
 * Stackra file contract:
 * Purpose: `CallAuthData`, what `CallAuthenticator` answers for a verified call and the generated Encore auth handler
 *          returns as its auth data: Encore's `userID` and the typed `Actor` the endpoints read (`getAuthData()`),
 *          and, for an API-key call, the verified key's credential.
 * Boundary: a type only. `userID` is the actor's public id, never the provider's subject. The generated adapter
 *           passes `credential` on to the action pipeline and to `serveVersioned`, which reads its version pin.
 * Runtime: node
 * Governing contract: ADR 0098 (the actor from the credential); ADR 0209 (decision 3); ADR 0278 (amendment of
 *                     2026-11-09: the gateway's API-key path); STA-2532.
 */
import type { Actor } from "@stackra/contracts";

import type { CallAuthCredential } from "#server/types/call-auth-credential.type";

/** The verified caller of one call. */
export interface CallAuthData {
  /** The actor's public id (`usr_…`, `svc_…`), Encore's user id. */
  readonly userID: string;

  /** The verified actor the call runs as, user or service. */
  readonly actor: Actor;

  /** The verified API key, for an `api_client` call; absent for every other caller. */
  readonly credential?: CallAuthCredential;
}
