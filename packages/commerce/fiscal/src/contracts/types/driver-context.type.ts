/**
 * Stackra file contract:
 * Purpose: `DriverContext`, what every driver call gets besides its subject: the unit and the pack options of the
 *          mandate in force.
 * Boundary: a type only; built by `FiscalService` from the target and the pack. `options` is raw pack data the driver
 *           parses itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 2).
 */

/** The unit and options of one driver call. */
export type DriverContext = {
  /** The till or invoicing unit. */
  readonly unitId: string;
  /** The mandate's options, unvalidated. */
  readonly options: Readonly<Record<string, unknown>>;
};
