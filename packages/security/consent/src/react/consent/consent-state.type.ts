/**
 * Stackra file contract:
 * Purpose: `ConsentState`, what `useConsent()` returns: every category's status and its writer, for a settings page
 *          that shows one switch per category.
 * Boundary: a type only. Before the client has read the stored decision (`isLoaded` false) every optional category
 *           reads as `undecided` and not granted; the writers go through the `ConsentLedger`.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1, 3 and 6); ADR 0294 (decision 8).
 */
import type { ConsentCategory, ConsentStatus } from "#core/index";

/** Every category's consent in a component. */
export interface ConsentState {
  /** Whether the client has read the stored decision. */
  readonly isLoaded: boolean;

  /** The status of `category`. */
  readonly status: (category: ConsentCategory) => ConsentStatus;

  /** Whether `category` is granted. */
  readonly isGranted: (category: ConsentCategory) => boolean;

  /** Grants (`true`) or refuses (`false`) `category`; a required category stays granted. */
  readonly set: (category: ConsentCategory, granted: boolean) => void;

  /** Forgets every decision, so the visitor is asked again. */
  readonly reset: () => void;
}
