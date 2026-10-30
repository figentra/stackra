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
  readonly tier: ComponentTier;
  readonly category: ComponentCategory;
  readonly platforms: readonly Platform[];
  /** "en" or "ar". */
  readonly lang: string;
  readonly title: string;
  readonly description: string;
  readonly keywords: readonly string[];
  /** Section and example headings. */
  readonly headings: readonly string[];
  readonly propNames: readonly string[];
}
