/**
 * Stackra file contract:
 * Purpose: `CapabilityRefusal`, the typed refusal a capability returns instead of throwing (ADR 0250 decision 3): the
 *          target or device does not offer it (`unavailable`), or the user or the system refused the permission
 *          (`permission_denied`). The code is a translation key: `I18n.<member>.capabilities[refusal.code]`.
 * Boundary: a type only; data, never an exception. The two codes are the whole set, so a caller can index a
 *           translation table by them.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 3: category `unavailable`, not a crash); ADR 0231 (snake_case codes).
 */

/** Why a capability call did not happen. */
export interface CapabilityRefusal {
  /** `unavailable`: not offered here; `permission_denied`: the permission was refused. */
  readonly code: "unavailable" | "permission_denied";

  /** The capability code that refused (`local_notifications`, `share`). */
  readonly capability: string;
}
