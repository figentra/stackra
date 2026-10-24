/**
 * Stackra file contract:
 * Purpose: the changes between two themes: the theme's shape with every part optional at every depth, holding only
 *          the leaves that differ. `diffTheme` makes one and `mergeTheme` applies one to a base; the "changes only"
 *          JSON export carries one.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System).
 */
import type { Theme } from "#contracts/types/theme.type";

/** A value with every part optional at every depth. */
type Partially<Value> = Value extends string | number | boolean
  ? Value
  : { readonly [Key in keyof Value]?: Partially<Value[Key]> };

/** The leaves of a theme that differ from a base theme. */
export type ThemeDiff = Partially<Theme>;
