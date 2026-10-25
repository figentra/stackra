/**
 * Stackra file contract:
 * Purpose: `TestActor`, who `loginAs` signs in: a seeded role in an active tenant, with the tenants they belong to.
 * Boundary: a type only; the role and tenant ids are the seed's.
 * Runtime: node (Playwright)
 * Governing contract: ADR 0269 (decision 6).
 */

/** The actor of a journey. */
export interface TestActor {
  /** The seeded role (`staff`, `admin`). */
  readonly role: string;

  /** The active tenant (`ten_1`). */
  readonly tenant: string;

  /** Every tenant the actor belongs to; the active one alone when left out. */
  readonly memberships?: readonly string[];
}
