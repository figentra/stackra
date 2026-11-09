/**
 * Stackra file contract:
 * Purpose: `PasskeySummary`, one passkey on the signed-in user's account as the SecurityPage lists it: its id, the
 *          name the user gave it, when it was added and when it was last used.
 * Boundary: a type only; never the credential itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (client ports); ADR 0206 (decision 8).
 */

/**
 * One passkey on the signed-in user's account, as the SecurityPage lists it.
 *
 * @example
 * const passkey: PasskeySummary = { id: "pk_1", name: "iPhone", createdAt, lastUsedAt: null };
 */
export interface PasskeySummary {
  /** The provider's id of the passkey. */
  readonly id: string;

  /** The name the user gave it. */
  readonly name: string;

  /** When it was added. */
  readonly createdAt: Date;

  /** When it last signed the user in; `null` when never. */
  readonly lastUsedAt: Date | null;
}
