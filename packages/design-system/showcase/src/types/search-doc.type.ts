/**
 * Stackra file contract:
 * Purpose: `SearchDoc`, one entry of the generated search index, per entry and locale.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 7.5; ADR 0305 (one declaration per file).
 */
import type { ComponentCategory } from "#src/enums/component-category.enum";
import type { ComponentTier } from "#src/enums/component-tier.enum";
import type { Platform } from "#src/enums/platform.enum";

/** One searchable entry in one locale. */
export interface SearchDoc {
  /** The entry key, "free/button". */
  readonly key: string;
  /** The registry tier of the entry. */
  readonly tier: ComponentTier;
  /** The entry's category. */
  readonly category: ComponentCategory;
  /** The platforms the entry ships on. */
  readonly platforms: readonly Platform[];
  /** "en" or "ar". */
  readonly lang: string;
  /** The entry's title in this locale. */
  readonly title: string;
  /** The entry's description in this locale. */
  readonly description: string;
  /** Extra words the entry is found by. */
  readonly keywords: readonly string[];
  /** Section and example headings. */
  readonly headings: readonly string[];
  /** The names of the entry's props. */
  readonly propNames: readonly string[];
}
