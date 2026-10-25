/**
 * Stackra file contract:
 * Purpose: `ProviderCall`, a call as the telephony provider reports it: its id there, the state and, once over, how long
 *          it lasted.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: PUT-216.
 */
import type { CallStatus } from "#contracts/enums/call-status.enum";

/** A call at the provider. */
export interface ProviderCall {
  /** The provider's call id. */
  readonly providerRef: string;

  /** Its state. */
  readonly status: CallStatus;

  /** Seconds connected, once over. */
  readonly durationSeconds?: number;
}
