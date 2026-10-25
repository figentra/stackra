/**
 * Stackra file contract:
 * Purpose: `VisibilityRegistration`, one row gen hands `registerVisibility`: a model that declares `@Visibility`, its
 *          key as visibility rules name it, its attributes as a `record` fact source, and what a record no allow rule
 *          matches gets.
 * Boundary: a type only. The key is derived and lives nowhere on the class at runtime, so this row is how the query
 *           filter finds the rules of a model. `rules` registers exactly the facet's attributes under `record`.
 *           `unmatched` is required and has no default: ADR 0333 decision 7 leaves it to the owner, so no record type
 *           ships one in code.
 * Runtime: node
 * Governing contract: ADR 0333 (decisions 1, 4 and 7); ADR 0331 (decision 4: fact sources); ADR 0294 (decision 20:
 *                     derived identities).
 */
import type { AnyClass } from "@stackra/container";
import type { Rules } from "@stackra/rules";

import type { Decision } from "#core/index";

/** The visibility of one model. */
export interface VisibilityRegistration {
  /** The model class, which carries `@Visibility`. */
  readonly model: AnyClass;

  /** The model's key (`catalogue.product`), as a `VisibilityRule` names it. */
  readonly key: string;

  /** The facet's attributes as the `record` fact source; absent when it declares none. */
  readonly rules?: Rules;

  /** What a record no allow rule matches gets: `Allow` (visible unless denied) or `Deny` (hidden). */
  readonly unmatched: Exclude<Decision, typeof Decision.Abstain>;
}
