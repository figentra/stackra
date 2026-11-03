/**
 * Stackra file contract:
 * Purpose: `Wire<T>`, the JSON form of a recorded panel node `T`: every action or query class becomes its versioned
 *          key (`orders.order.cancel@1`), every enum its `Enum.of` definition (`{ Paid: ["paid", { tone: "success" }] }`),
 *          and an icon element, which cannot travel, is left out of the type (an icon travels by its name). A primitive,
 *          branded or not (`I18nKey`), stays as it is.
 * Boundary: a type only, derived from the node types so the two never drift. Everything else is already JSON.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 5: gen records the trees, classes as keys); ADR 0164 (decision 2); the SDUI
 *                     catalogue case `resources` (STA-1981, build-list item 54).
 */
import type { AnyClass } from "@stackra/container";
import type { Enum } from "@stackra/contracts";
import type { IconName } from "@stackra/icons/contracts";
import type { IconSlot } from "@stackra/ui/contracts";

/** An icon element: the part of `IconSlot` that is not a name. */
type IconElement = Exclude<IconSlot, IconName>;

/** The JSON form of `T`. */
export type Wire<T> = T extends string | number | boolean | null | undefined
  ? T
  : T extends AnyClass
    ? string
    : T extends IconElement
      ? never
      : T extends Enum.Any
        ? Enum.Definition
        : T extends readonly (infer E)[]
          ? readonly Wire<E>[]
          : T extends object
            ? { readonly [K in keyof T]: Wire<T[K]> }
            : T;
