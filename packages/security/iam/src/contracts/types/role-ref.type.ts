/**
 * Stackra file contract:
 * Purpose: `RoleRef`, a role named as the audience of a deny or visibility rule (`{ kind: "role", key }`).
 * Boundary: a type only. A principal is in the audience while it holds a grant of that role that applies where the
 *           call acts.
 * Runtime: isomorphic
 * Governing contract: ADR 0333 (decision 2); ADR 0208 (decision 2: roles).
 */

/**
 * A role as an audience.
 *
 * @example
 * const managers: RoleRef = { kind: "role", key: SystemRole.Manager };
 */
export interface RoleRef {
  /** Marks the audience as a role. */
  readonly kind: "role";

  /** The role's key, as a grant names it. */
  readonly key: string;
}
