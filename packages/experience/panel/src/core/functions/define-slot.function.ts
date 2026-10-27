/**
 * Stackra file contract:
 * Purpose: `defineSlot<P>(options)`, how a shell package declares a slot: its key, surface, cardinality and, as the
 *          type argument, its props type. Gen reads every exported `defineSlot` call into the manifest's `slots`
 *          (key, surface, cardinality and the props record) for the OS registry and for the fill check.
 * Boundary: pure; returns a frozen object. Write it as `export const X = defineSlot<Props>({ ... })` with static
 *           options, one per file, so gen can read it without running it.
 * Runtime: isomorphic
 * Governing contract: ADR 0438 (slots, not shadowing); ADR 0294 (decision 20: derived identities, locked once named);
 *                     app-shells-edge-and-extension.md 7.2 and 12.2.1.
 */
import type { Slot } from "#core/types/slot.type";
import type { SlotOptions } from "#core/types/slot-options.type";

/** A snake_case dotted key of at least two segments. */
const KEY = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

/** A snake_case surface code. */
const SURFACE = /^[a-z][a-z0-9_]*$/;

/**
 * The slot `options` declares, with props `P`.
 *
 * @throws RangeError when the key is not snake_case dotted, the surface not a snake_case code, or the cardinality
 *         neither `one` nor `many`.
 * @example
 * export const SignInBrandPanel = defineSlot<BrandPanelProps>({ key: "auth.sign_in.brand_panel", surface: "console" });
 * SignInBrandPanel.cardinality; // "one"
 */
export function defineSlot<P extends object>(options: SlotOptions): Slot<P> {
  if (!KEY.test(options.key))
    throw new RangeError(`defineSlot: "${options.key}" is not a snake_case dotted key`);
  if (!SURFACE.test(options.surface))
    throw new RangeError(`defineSlot: "${options.surface}" is not a snake_case surface code`);
  const cardinality = options.cardinality ?? "one";
  if (cardinality !== "one" && cardinality !== "many")
    throw new RangeError(
      `defineSlot: cardinality is "one" or "many", got ${JSON.stringify(cardinality)}`,
    );
  return Object.freeze({ key: options.key, surface: options.surface, cardinality });
}
