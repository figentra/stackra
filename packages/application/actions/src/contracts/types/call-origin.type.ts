/**
 * Stackra file contract:
 * Purpose: `CallOrigin`, where one call came from as a product surface: its kind (storefront, console, API key, agent)
 *          and the public id of that surface's credential or agent, so a storefront can bind its keys to one origin and
 *          an audit entry or an AI attribution names the agent behind a call.
 * Boundary: a type only. The transport fills it from the verified credential (the storefront key, the session, the API
 *           key, the agent's tool dispatcher), never from request input. Unlike `CallClient` it is no personal data: it
 *           rides on the call descriptor, so the audit entry and every port see it.
 * Runtime: isomorphic
 * Governing contract: ADR 0456 (decision 1); ADR 0136 (decision 1: the handler context).
 */
import type { CallOriginKind } from "#contracts/enums/call-origin-kind.enum";

/** The surface one call arrived through. */
export interface CallOrigin {
  /** The surface's kind. */
  readonly kind: CallOriginKind;

  /** The public id of the storefront, API key or agent; absent for the console, whose actor already names the user. */
  readonly id?: string;
}
