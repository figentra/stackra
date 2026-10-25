/**
 * Stackra file contract:
 * Purpose: `BlockOptions`, what `Block({...})` takes: the palette group, the icon the palette shows, the query
 *          whose output the renderer hands the block's component as `data`, and the document kinds it fits.
 * Boundary: a type only. The key (`web.hero_section`) is derived from the member and the folder, and the renderer is
 *           the component beside the block file, bound by name, so neither is an option. The icon is an `IconName`,
 *           written as a generated constant (`Icons.Sparkles`), never a raw string (R-56).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0110 (decision 2: data binds to query keys); ADR 0309; ADR 0270
 *                     (decision 6: document kinds).
 */
import type { QueryRef } from "@stackra/clients";
import type { IconName } from "@stackra/icons/contracts";

import type { ExperienceKind } from "#contracts/enums/experience-kind.enum";

import type { BlockCategory } from "#core/enums/block-category.enum";

/** The options of a block class. */
export interface BlockOptions<Q extends QueryRef | undefined = undefined> {
  /** The palette group. */
  readonly category: BlockCategory;

  /** The icon beside the block's name in the palette. */
  readonly icon: IconName;

  /** The consumed query (`ListEntriesQuery`) whose output the component receives as `data`; its input is the node's. */
  readonly accepts?: Q;

  /**
   * The document kinds the block may be placed in (`[ExperienceKind.EmailTemplate]` for an email-safe block); a page
   * and a screen when absent.
   */
  readonly kinds?: readonly ExperienceKind[];
}
