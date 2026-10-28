/**
 * Stackra file contract:
 * Purpose: `Entitlement`, the kind base of a plan right: `class ProductLimitEntitlement extends Entitlement({ kind:
 *          EntitlementKind.Limit, counts: () => Product }) {}` in a module's `access/` group, one
 *          `<name>.entitlement.ts` per right. A limit may filter what it counts: `where: { retiredAt: null }`. A quota
 *          names a meter and a period: `{ kind: EntitlementKind.Quota, meter: "ai.tokens", per: QuotaPeriod.Month }`. The interface of the same name is its instance side.
 * Boundary: called only (`kind` is required). The call checks and records its options in the kind registry; the plan
 *           driver and gen read them through `kindOf`. The key and the label key are derived from the class name and
 *           the module, so neither is an option. An entitlement holds no grant: grants come from the
 *           `EntitlementSource`. It gates calls, never records, so it is an option on a kind, not a model trait
 *           (final review H, R-61).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16, 20 and 25); ADR 0305 (rules 2 and 3); ADR 0215 (decisions 1 and 7); STA-913
 *                     (the `where` filter); ADR 0216 (decision 3: quotas, stackra-309).
 */
import { createKind } from "@stackra/container";
import { Enum } from "@stackra/contracts";

import { EntitlementKind } from "#core/enums/entitlement-kind.enum";
import { QuotaPeriod } from "#core/enums/quota-period.enum";
import type { EntitlementClass } from "#core/types/entitlement-class.type";
import type { EntitlementOptions } from "#core/types/entitlement-options.type";

/** The instance side of every entitlement class. */
export interface Entitlement {
  /** Type-only kind brand, so a class of another kind cannot stand in for an entitlement. */
  readonly "~kind": "entitlement";
}

/**
 * Checks `options`: a known kind, a `counts` thunk exactly when the kind is a limit, a `where` filter only on a
 * limit, as field equality, and a `meter` and a `per` exactly when the kind is a quota.
 *
 * @throws RangeError when `kind` is not an `EntitlementKind`, or a quota's `per` is not a `QuotaPeriod`.
 * @throws TypeError when a limit has no `counts` thunk, another kind has one or a `where`, `where` is not a plain
 *         object of scalar values, a quota has no meter name, or another kind has a `meter` or a `per`.
 */
function readEntitlementOptions(options: EntitlementOptions): Readonly<Record<string, unknown>> {
  const { kind, counts, where, meter, per } = options ?? {};
  if (!Enum.values(EntitlementKind).includes(kind))
    throw new RangeError(
      `Entitlement({ kind }) needs a kind from EntitlementKind, got ${JSON.stringify(kind)}`,
    );
  if (kind === EntitlementKind.Quota) {
    if (typeof meter !== "string" || meter === "")
      throw new TypeError('A quota entitlement names the meter it reads: meter: "ai.tokens"');
    if (!Enum.values(QuotaPeriod).includes(per as QuotaPeriod))
      throw new RangeError(
        `A quota entitlement needs a period from QuotaPeriod, got ${JSON.stringify(per)}`,
      );
    if (counts !== undefined || where !== undefined)
      throw new TypeError("A quota entitlement reads a meter; it counts no model");
    return { kind, meter, per };
  }
  if (meter !== undefined || per !== undefined)
    throw new TypeError(`Only a quota entitlement reads a meter, not a ${kind} entitlement`);
  if (kind === EntitlementKind.Limit && typeof counts !== "function")
    throw new TypeError("A limit entitlement names the model it counts: counts: () => Model");
  if (kind !== EntitlementKind.Limit && counts !== undefined)
    throw new TypeError(`Only a limit entitlement counts a model, not a ${kind} entitlement`);
  if (where !== undefined) {
    if (kind !== EntitlementKind.Limit)
      throw new TypeError(
        `Only a limit entitlement filters what it counts, not a ${kind} entitlement`,
      );
    const plain =
      typeof where === "object" &&
      where !== null &&
      !Array.isArray(where) &&
      Object.values(where).every((value) => value === null || typeof value !== "object");
    if (!plain)
      throw new TypeError(
        "A limit's where is field equality on its counted model: where: { retiredAt: null }",
      );
  }
  if (counts === undefined) return { kind };
  return where === undefined
    ? { kind, counts }
    : { kind, counts, where: Object.freeze({ ...where }) };
}

/**
 * The entitlement kind base.
 *
 * @example
 * export class ProductLimitEntitlement extends Entitlement({
 *   kind: EntitlementKind.Limit,
 *   counts: () => Product,
 * }) {}
 */
export const Entitlement = createKind(
  "entitlement",
  // oxlint-disable-next-line typescript/no-extraneous-class -- reason: createKind needs a class; an entitlement holds no state
  class EntitlementBase {},
  readEntitlementOptions,
) as (options: EntitlementOptions) => EntitlementClass;
