/**
 * Stackra file contract:
 * Purpose: `Service`, the bare kind base of a service: a class in a module's `services/` group (or a package's
 *          `core/services/`) that other classes inject by its type.
 * Boundary: a binding with no options, so there is no called form. It assigns nothing in a constructor and keeps no
 *           state (0294 decision 25); its dependencies are its constructor parameters, wired by gen.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16, 17 and 25); ADR 0305 (rule 2); ADR 0127 2026-10-24 note (Service lives
 *                     in container).
 */
import { registerKind } from "#core/functions/register-kind.function";

/**
 * The service kind base.
 *
 * @example
 * export class LoyaltyService extends Service {
 *   constructor(ledger: LoyaltyLedger) {
 *     super();
 *     this.ledger = ledger;
 *   }
 * }
 */
export abstract class Service {
  /** Type-only kind brand, so a class of another kind cannot stand in for a service. */
  declare readonly "~kind": "service";
}

registerKind(Service, "service");
