/**
 * Stackra file contract:
 * Purpose: `DevtoolsAttachment`, what `kit.attach(host)` returns: the host's session and the way to let go.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0246 (decisions 2 and 3).
 */
import type { DevtoolsSession } from "#core/types/devtools-session.type";

/** One attached host. */
export interface DevtoolsAttachment {
  /** The host's view of the kit. */
  readonly session: DevtoolsSession;

  /** Ends the session so another host may attach; safe to call twice. */
  detach(): void;
}
