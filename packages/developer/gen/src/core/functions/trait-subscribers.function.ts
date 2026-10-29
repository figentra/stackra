/**
 * Stackra file contract:
 * Purpose: `traitSubscribers`, the `@stackra/database` ORM subscribers a service's boot adds because a model, its own
 *          or a declared package's, has their trait: `TreeSubscriber` for `HasTree` (it keeps `treePath`, STA-1419).
 * Boundary: pure; reads the IR only. Names come back in the order the boot registers them, which is the order the ORM
 *           runs them on a flush. Each needs no constructor argument.
 * Runtime: isomorphic
 * Governing contract: ADR 0096 (decision 4: traits run as ORM subscribers); ADR 0321 (`HasTree`); STA-339 (the
 *                     generated boot registers them).
 */
import type { MemberIR } from "#core/types/member-ir.type";

/** Each trait and the subscriber the boot adds for it, in registration order. */
const BY_TRAIT: readonly { readonly trait: string; readonly subscriber: string }[] = [
  { trait: "HasTree", subscriber: "TreeSubscriber" },
];

/**
 * The trait subscribers `ir`'s boot registers, after the always-on ones.
 *
 * @param ir - the member read by discovery.
 * @example
 * traitSubscribers(categoriesIr); // ["TreeSubscriber"]
 */
export function traitSubscribers(ir: MemberIR): string[] {
  const has = (trait: string): boolean =>
    ir.classes.some(
      (declared) => declared.kind === "model" && declared.traits.some((use) => use.name === trait),
    ) ||
    ir.dependencies.some(({ manifest }) =>
      (manifest.models ?? []).some((model) => model.traits.includes(trait)),
    );
  return BY_TRAIT.filter(({ trait }) => has(trait)).map(({ subscriber }) => subscriber);
}
