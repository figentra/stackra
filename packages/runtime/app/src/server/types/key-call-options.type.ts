/**
 * Stackra file contract:
 * Purpose: `KeyCallOptions`, what an API key's call carries beside its actor: the verified key as the call's
 *          `credential`, the key as its `origin`, and whether it runs in the tenant's sandbox (a test key).
 * Boundary: a type only, the `CallOptions` fields of the same names. Set only by `CallAuthenticator` from the verified
 *           key, never from input or a header.
 * Runtime: node
 * Governing contract: ADR 0278 (as amended: the gateway path, STA-2646 B3); ADR 0098 (the actor from the credential).
 */
import type { CallCredential, CallOrigin } from "@stackra/actions/contracts";

/** The call options of one verified API key. */
export interface KeyCallOptions {
  /** The key: its public id, scopes, kind and version pin; never its text. */
  readonly credential: CallCredential;

  /** The surface: an API key, by the key's public id. */
  readonly origin: CallOrigin;

  /** True for a test key: the call runs in the tenant's sandbox. */
  readonly sandbox: boolean;
}
