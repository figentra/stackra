/**
 * Stackra file contract:
 * Purpose: a brand above a theme (ADR 0340 decision 2): the changes it makes (a `ThemeDiff`), the name of the theme
 *          it extends, the name the resolved theme takes, an id that may be anything (a tenant's public id included),
 *          and an optional policy for the layers below it. A layer is a diff, never a second schema.
 * Boundary: types only; `resolveTheme` folds a base theme through a list of layers.
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (decision 2).
 */
import type { LayerPolicy } from "#contracts/types/layer-policy.type";
import type { ThemeDiff } from "#contracts/types/theme-diff.type";

/** One layer of brand over a theme. */
export interface ThemeLayer {
  /** Who owns the layer: any string, a product key or a tenant's public id (`ten_01H…`). */
  readonly id: string;
  /** The resolved theme's name, kebab-case; `themeNameOf(id)` derives one from an id. */
  readonly name: string;
  /** The name of the theme this layer sits on; `resolveTheme` refuses the layer when it differs. */
  readonly extends: string;
  /** The changes, leaves only; a colour's hex is recomputed from its oklch value, so it may be left out. */
  readonly changes: ThemeDiff;
  /** The rules for every layer below this one. */
  readonly policy?: LayerPolicy;
}
