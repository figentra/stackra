/**
 * Stackra file contract:
 * Purpose: `@Replaces(Port)`, the class facet that binds a custom driver in place of the drivers a port's package
 *          ships, across the whole container.
 * Boundary: made with `createDecorator`, so it records only; gen reads it from source and prints the replacement in
 *           the wiring's `replaces`, which is what the container acts on. It may mark drivers only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 6 and 19); ADR 0263 (decision 9 as amended by 0294).
 */
import type { Port } from "@stackra/contracts";

import { createDecorator } from "#core/functions/create-decorator.function";
import type { AnyClass } from "#core/types/any-class.type";

/**
 * Binds the decorated driver in place of the port's drivers.
 *
 * @example
 * ```ts
 * @Replaces(LoyaltyLedger)
 * export class LegacyLoyaltyLedgerDriver extends Driver(LoyaltyLedger) { ... }
 * ```
 */
export const Replaces = createDecorator<AnyClass<Port>>({
  kind: "replaces",
  target: "class",
  kinds: ["driver"],
});
