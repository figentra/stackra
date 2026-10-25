/**
 * Stackra file contract:
 * Purpose: `SeedResult`, what seeding one rule-set template into a scope did: created it, moved it to the new seed
 *          version, kept the tenant's own edit, or found it already at that version.
 * Boundary: an `Enum.of` value plus the type of the same name; the seed runner shows it per template in the ops
 *           console. A new seed version never overwrites a tenant's edit (`kept`).
 * Runtime: isomorphic
 * Governing contract: config-model section 6 (a new seed version never overwrites tenant values); ADR 0325 (decision 7:
 *                     seed status); ADR 0294 (decision 16).
 */
import { Enum } from "@stackra/contracts";

/** The result of seeding one template. */
export const SeedResult = Enum.of({
  /** No seeded copy was there: it was created and published. */
  Created: "created",
  /** The seeded copy had no tenant edit: the new version was drafted and published. */
  Updated: "updated",
  /** The tenant edited the seeded copy: it stays as the tenant left it. */
  Kept: "kept",
  /** The seeded copy is already at this seed version. */
  Current: "current",
});

/** One of the codes above. */
export type SeedResult = Enum.Value<typeof SeedResult>;
