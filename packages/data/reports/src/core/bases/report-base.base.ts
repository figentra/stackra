/**
 * Stackra file contract:
 * Purpose: `ReportBase<S>`, the instance side every `Report<S>({...})` class shares: its written key and its checked
 *          declaration, read from the kind registry, which the report runner compiles.
 * Boundary: never extended directly: a report extends `Report<S>({...})` (report.base.ts), which records the checked
 *           options. It runs nothing itself; a run is the `ReportRunner` port's.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 1); ADR 0294 (decision 16).
 */
import { kindOf } from "@stackra/container";

import type { ReportDeclaration } from "#core/types/report-declaration.type";

/** The instance side every report shares. */
export abstract class ReportBase<S extends object = object> {
  /** Type-only kind brand, so a class of another kind cannot stand in for a report. */
  declare readonly "~kind": "report";

  /** Type-only source, so `ReportBase<Order>` and `ReportBase<Invoice>` differ. */
  declare readonly "~source": S;

  /**
   * The checked options of the report.
   *
   * @throws TypeError for a class that was not declared with `Report<S>({...})`.
   */
  get declaration(): ReportDeclaration {
    const record = kindOf(this.constructor);
    if (record?.kind !== "report" || typeof record.options["key"] !== "string")
      throw new TypeError(
        `${this.constructor.name} extends no Report<S>({ key, dimensions, measures })`,
      );
    return record.options as unknown as ReportDeclaration;
  }

  /** The written key (`order_sales`); gen prefixes the module key in the manifest. */
  get reportKey(): string {
    return this.declaration.key;
  }
}
