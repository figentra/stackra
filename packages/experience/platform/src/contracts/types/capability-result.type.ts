/**
 * Stackra file contract:
 * Purpose: `CapabilityResult<T>`, what a capability call that may be refused resolves to: `{ ok: true, data }` or
 *          `{ ok: false, error }` with a `CapabilityRefusal`, the envelope shape of ADR 0140.
 * Boundary: a type only. A refusal is a value the caller branches on (`if (!result.ok) toast(...)`), never a thrown
 *           error; a programming error still throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 3); ADR 0140 (envelope shape).
 */
import type { CapabilityRefusal } from "#contracts/types/capability-refusal.type";

/**
 * The outcome of a capability call.
 *
 * @example
 * const granted = await platform.notifications.requestPermission();
 * if (!granted.ok) toast.warning(t(I18n.console.capabilities[granted.error.code]));
 */
export type CapabilityResult<T = undefined> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: CapabilityRefusal };
