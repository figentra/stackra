/**
 * Stackra file contract:
 * Purpose: `KitInput`, everything one generator run read from the kit, the store folder and the parent kit, so the
 *          generators are pure functions of it.
 * Boundary: a type in the leaf entry. The parent kit arrives as data (its theme), never as code.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended: product sources in <repo>/assets/brand; the parent plugs in as data).
 */
import type { Theme } from "@stackra/tokens/contracts";

import type { BrandKit } from "#contracts/types/brand-kit.type";
import type { StoreCaptionSet } from "#contracts/types/store-caption-set.type";

/**
 * A read kit.
 *
 * @example
 * const accent = input.theme.colors.accent.hexLight;
 */
export interface KitInput {
  /** The validated `kit.json`. */
  readonly kit: BrandKit;

  /** The resolved theme: the kit's `tokens/theme.json` over the parent kit's theme over the stackra theme. */
  readonly theme: Theme;

  /** Every file of the kit folder, kit-relative and `/`-separated, sorted (the checklist reads it). */
  readonly files: readonly string[];

  /** Source files by kit-relative path (`logos/app-icon/app-icon-light.svg`, every logo or mark SVG, …); only the
   *  ones present. */
  readonly sources: ReadonlyMap<string, Uint8Array>;

  /** TrueType or OpenType fonts of the kit (`fonts/*.ttf|otf`), for captions. */
  readonly fonts: readonly Uint8Array[];

  /** Store captions per app and locale, sorted by app then locale. */
  readonly store: readonly StoreCaptionSet[];

  /** Hex SHA-256 of every input read, in path order. */
  readonly inputHash: string;
}
