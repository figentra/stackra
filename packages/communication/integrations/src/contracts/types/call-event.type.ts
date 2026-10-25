/**
 * Stackra file contract:
 * Purpose: `CallEvent`, what a telephony provider's webhook tells us, normalised: the call, its direction and numbers,
 *          its state, what the caller said (speech to text), and a finished recording.
 * Boundary: a type only. The webhook's signature is checked by `@stackra/webhooks` before a driver parses the event;
 *           numbers are personal data and are not logged.
 * Runtime: isomorphic
 * Governing contract: PUT-216; ADR 0308 (rule 15); ADR 0134 (personal data).
 */
import type { Url } from "@stackra/contracts";

import type { CallStatus } from "#contracts/enums/call-status.enum";

/** A call webhook, normalised. */
export interface CallEvent {
  /** The provider's call id. */
  readonly providerRef: string;

  /** Who called whom. */
  readonly direction: "inbound" | "outbound";

  /** The caller, E.164 when the provider knows it. */
  readonly from?: string;

  /** The number called. */
  readonly to?: string;

  /** The call's state. */
  readonly status: CallStatus;

  /** What the caller said in the last listen step, with the recogniser's confidence from 0 to 1. */
  readonly speech?: { readonly text: string; readonly confidence?: number };

  /** A finished recording's location at the provider. */
  readonly recordingUrl?: Url;
}
