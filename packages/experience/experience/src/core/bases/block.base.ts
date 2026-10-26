/**
 * Stackra file contract:
 * Purpose: `Block`, the kind base of a page-builder block: `class HeroSectionBlock extends Block({ category, icon })`
 *          in an app's `blocks/<name>/<name>.block.ts`. Its fields are the props a document may give it (typed,
 *          refined by field decorators, compiled by gen to one schema); its renderer is the component beside it, bound
 *          by name.
 * Boundary: called only (`category` and `icon` are required). The call checks the options and records them in the kind
 *           registry, with `accepts` as the query class or `null` and `kinds` as a frozen list (a page and a screen by
 *           default); `registerBlocks`, the renderers and gen read them
 *           through `kindOf`. The base keeps no state and its brand is protected and type-only, so `Fields<X>` is
 *           exactly the declared props and gen's `X$Check` holds. The key is derived (`web.hero_section`), so it is no
 *           option; `@Renamed(old)` keeps a published key resolving.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16, 20 and 25); ADR 0305 (rules 2, 3 and 43); ADR 0270 (decisions 3 and 6); ADR
 *                     0110 (decisions 1 and 2).
 */
import type { QueryRef } from "@stackra/clients";
import { createKind } from "@stackra/container";
import { Enum } from "@stackra/contracts";

import { ExperienceKind } from "#contracts/enums/experience-kind.enum";
import { DEFAULT_BLOCK_KINDS } from "#core/constants/default-block-kinds.constant";
import { BlockCategory } from "#core/enums/block-category.enum";
import type { BlockClass } from "#core/types/block-class.type";
import type { BlockOptions } from "#core/types/block-options.type";

/** The instance side every block shares. */
export abstract class BlockBase {
  /** Type-only kind brand; protected, so it is not in `keyof` and never counts as a prop. */
  declare protected readonly "~kind": "block";
}

/** A block instance: its fields are its props. */
export type Block = BlockBase;

/**
 * Checks `options` and records them.
 *
 * @throws RangeError when `category` is not a `BlockCategory` or `icon` is empty.
 * @throws TypeError when `accepts` is not a consumed query class.
 * @throws RangeError when `kinds` is empty or names something that is not an `ExperienceKind`.
 */
function readBlockOptions(
  options: BlockOptions<QueryRef | undefined>,
): Readonly<Record<string, unknown>> {
  if (!Enum.values(BlockCategory).includes(options?.category))
    throw new RangeError(
      `Block({ category }) needs a BlockCategory, got ${JSON.stringify(options?.category)}`,
    );
  const icon: unknown = options.icon;
  if (typeof icon !== "string" || icon === "")
    throw new RangeError("Block({ icon }) needs an icon name");
  const { accepts } = options;
  if (accepts !== undefined && (typeof accepts !== "function" || accepts.kind !== "query"))
    throw new TypeError("Block({ accepts }) takes a consumed query class (`ListEntriesQuery`)");
  const { kinds = DEFAULT_BLOCK_KINDS } = options;
  const known: readonly string[] = Enum.values(ExperienceKind);
  if (!Array.isArray(kinds) || kinds.length === 0 || kinds.some((kind) => !known.includes(kind)))
    throw new RangeError(
      `Block({ kinds }) takes one or more ExperienceKind values, got ${JSON.stringify(kinds)}`,
    );
  return {
    category: options.category,
    icon: options.icon,
    accepts: accepts ?? null,
    kinds: Object.freeze([...new Set(kinds)]),
  };
}

/**
 * The block kind base.
 *
 * @example
 * export class TestimonialsBlock extends Block({
 *   category: BlockCategory.Content,
 *   icon: Icons.Quote,
 *   accepts: ListEntriesQuery,
 * }) {
 *   title!: LocalizedText;
 *
 *   @Int({ min: 1, max: 12 })
 *   limit = 3;
 * }
 */
export const Block = createKind("block", BlockBase, readBlockOptions) as <
  Q extends QueryRef | undefined = undefined,
>(
  options: BlockOptions<Q>,
) => BlockClass<Q>;
