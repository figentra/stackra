/**
 * Stackra file contract:
 * Purpose: `Entitlement`, the kind base of a plan right: `class ProductLimitEntitlement extends Entitlement({ kind:
 *          EntitlementKind.Limit, counts: () => Product }) {}` in a module's `access/` group, one
 *          `<name>.entitlement.ts` per right. The interface of the same name is its instance side.
 * Boundary: called only (`kind` is required). The call checks and records its options in the kind registry; the plan
 *           driver and gen read them through `kindOf`. The key and the label key are derived from the class name and
 *           the module, so neither is an option. An entitlement holds no grant: grants come from the
 *           `EntitlementSource`. It gates calls, never records, so it is an option on a kind, not a model trait
 *           (final review H, R-61).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16, 20 and 25); ADR 0305 (rules 2 and 3); ADR 0215 (decisions 1 and 7).
 */
import { createKind } from "@stackra/container";
import { Enum } from "@stackra/contracts";

import { EntitlementKind } from "#core/enums/entitlement-kind.enum";
import type { EntitlementClass } from "#core/types/entitlement-class.type";
import type { EntitlementOptions } from "#core/types/entitlement-options.type";

/** The instance side of every entitlement class. */
export interface Entitlement {
  /** Type-only kind brand, so a class of another kind cannot stand in for an entitlement. */
  readonly "~kind": "entitlement";
}

/**
 * Checks `options`: a known kind, and a `counts` thunk exactly when the kind is a limit.
 *
 * @throws RangeError when `kind` is not an `EntitlementKind`.
 * @throws TypeError when a limit has no `counts` thunk, or another kind has one.
 */
function readEntitlementOptions(options: EntitlementOptions): Readonly<Record<string, unknown>> {
  const { kind, counts } = options ?? {};
  if (!Enum.values(EntitlementKind).includes(kind))
    throw new RangeError(
      `Entitlement({ kind }) needs a kind from EntitlementKind, got ${JSON.stringify(kind)}`,
    );
  if (kind === EntitlementKind.Limit && typeof counts !== "function")
    throw new TypeError("A limit entitlement names the model it counts: counts: () => Model");
  if (kind !== EntitlementKind.Limit && counts !== undefined)
    throw new TypeError(`Only a limit entitlement counts a model, not a ${kind} entitlement`);
  return counts === undefined ? { kind } : { kind, counts };
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
