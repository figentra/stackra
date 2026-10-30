/**
 * Stackra file contract:
 * Purpose: `ComponentEntry`, the one registry row both showcases, the API generator and search read for a component.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1; ADR 0305 (one declaration per file).
 */
import type { ComponentCategory } from "#src/enums/component-category.enum";
import type { ComponentStatus } from "#src/enums/component-status.enum";
import type { ComponentTier } from "#src/enums/component-tier.enum";
import type { Platform } from "#src/enums/platform.enum";
import type { ExampleEntry } from "#src/types/example-entry.type";
import type { HapticEntry } from "#src/types/haptic-entry.type";
import type { HeroLink } from "#src/types/hero-link.type";

/** One component of the showcases. Its key is `${tier}/${slug}`; paths, import lines and i18n keys are derived. */
export interface ComponentEntry {
  /** The slug without a tier prefix: "button", "kanban". */
  readonly slug: string;
  /** The tier: the web path is `/<slug>` for free and `/pro-<slug>` for Pro. */
  readonly tier: ComponentTier;
  /** The category it is listed under. */
  readonly category: ComponentCategory;
  /** The platforms it is shown on; a single platform shows a "Web only" or "Native only" chip. */
  readonly platforms: readonly Platform[];
  /** The package it is imported from, such as "@stackra/ui" (open, so another repo's registry fits). */
  readonly packageName: string;
  /** The export: `import { Button } from "@stackra/ui/react"`. */
  readonly exportName: string;
  /** Compound parts in HeroUI order; `[exportName]` for a leaf component. */
  readonly parts: readonly string[];
  /** The HeroUI counterpart per platform. */
  readonly hero: Partial<Record<Platform, HeroLink>>;
  /** The examples; `[0]` renders as "Usage". Empty only for a `planned` entry. */
  readonly examples: readonly ExampleEntry[];
  /** Up to three related keys, such as "free/icon-button". */
  readonly related: readonly string[];
  /** The design tokens it reads, such as "color.accent" or "radius.field". */
  readonly tokens: readonly string[];
  /** The haptics it plays on native. */
  readonly haptics?: readonly HapticEntry[];
  /** English search synonyms; Arabic ones are `showcase::component.<tier>.<slug>.keywords`. */
  readonly keywords: readonly string[];
  /** The status chip. */
  readonly status?: ComponentStatus;
  /**
   * An "Advanced" chip on the page and in the nav: a specialist component (a box plot, a sankey) most screens never
   * need. A marker only, unrelated to the tier: an advanced entry stays free.
   */
  readonly advanced?: true;
  /** Accessibility notes, keys into `showcase::a11y.<key>`, used when HeroUI has no section. */
  readonly a11y?: readonly string[];
}
