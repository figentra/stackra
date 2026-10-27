/**
 * Stackra file contract:
 * Purpose: the population a signed-in user belongs to: the `realm` of a `User` actor, read by policies
 *          (`actor.realm === Realm.Customer`) and by the settings scopes.
 * Boundary: an `Enum.of` value plus the type of the same name. Only user actors have a realm. A tenant's
 *           administrators are tenant users holding an admin role, not a realm of their own.
 * Runtime: isomorphic
 * Governing contract: ADR 0098 (decision 6: the actor model), ADR 0294 (decision 23: one meaning per word), ADR 0231
 *                     (snake_case codes).
 */
import { Enum } from "#core/bases/enum.base";

/** The three user populations. */
export const Realm = Enum.of({
  /** The platform's own operators. */
  Platform: "platform",
  /** A tenant's staff. */
  Staff: "tenant",
  /** A tenant's customers. */
  Customer: "customer",
});

/** One of the codes above. */
export type Realm = Enum.Value<typeof Realm>;
