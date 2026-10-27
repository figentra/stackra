/**
 * Stackra file contract:
 * Purpose: `EntitlementOptions`, what `Entitlement({...})` takes: the kind of plan right and, for a limit, the model it
 *          counts and the filter of which of its records count.
 * Boundary: a type only. The key (`catalogue.product_limit`) and the label key are derived from the class name and
 *           the module, so neither is an option. The plan values are data in the entitlement system, never here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20: the Entitlement row, derived identities); ADR 0215 (decisions
 *                     1 and 7); STA-913 (the `where` filter).
 */
import type { AnyClass } from "@stackra/container";

import type { EntitlementFilter } from "#contracts/types/entitlement-filter.type";
import type { EntitlementKind } from "#core/enums/entitlement-kind.enum";

/** The options of an entitlement class. */
export interface EntitlementOptions {
  /** Feature, limit, module or value (a plain number the plan sets, ADR 0408). */
  readonly kind: EntitlementKind;

  /**
   * The model a limit counts, as a thunk so a model file and its entitlement may import each other. Required for a
   * limit and refused for every other kind; gen puts the limit's gate on that model's generated create.
   */
  readonly counts?: () => AnyClass;

  /**
   * Which of the counted records count, as field equality (`{ retiredAt: null }`): a retired till stops counting and
   * frees its seat. A limit only; absent, every live record counts.
   */
  readonly where?: EntitlementFilter;
}
