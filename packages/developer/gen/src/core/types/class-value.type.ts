/**
 * Stackra file contract:
 * Purpose: `ClassValue`, how gen's constant evaluator records a class written inside kind options or decorator
 *          arguments (`exports: [LoyaltyService]`, `invalidateOn: [OrderPaid]`, `Driver(LoyaltyLedger)`), or a static
 *          member of one (`permission: OrderPermissions.read`): the class's name, where to import it from, its kind
 *          when it has one, and the member read.
 * Boundary: a type only. The manifest prints a class value as an identity when it has one (an event's wire name, a
 *           permission key) and as its name otherwise; the wiring imports it by `from`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 25: gen reads options from source); ADR 0305 (rule 9: class references in
 *                     options list collaborators).
 */

/** A class, or a static member of one, written as a value inside options. */
export interface ClassValue {
  /** The class name. */
  readonly $class: string;

  /** The module specifier a generated file imports it from. */
  readonly from: string;

  /** Its kind code, when it extends a kind base. */
  readonly kind?: string;

  /** The static member read (`read` of `OrderPermissions.read`). */
  readonly member?: string;
}
