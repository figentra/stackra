/**
 * Stackra file contract:
 * Purpose: `ThemeDocument`, a theme as data (ADR 0501 section 7): a changes-only layer over a named base theme with
 *          the id, label and status a dashboard stores, previews, publishes and applies at runtime with no rebuild.
 *          The built-in presets are seed documents of the same shape.
 * Boundary: a type only; `parseThemeDocument` validates one and `createThemeDocument` writes one. Storage, selection
 *           and locking belong to the appearance settings, never to this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2); ADR 0340 (decisions 2 and 6: layers and token sets).
 */
import type { ThemeDiff } from "#contracts/types/theme-diff.type";

/** A theme as a stored, named document. */
export interface ThemeDocument {
  /** The document format, `stackra.theme-document/1`. */
  readonly format: "stackra.theme-document/1";
  /** The stable id a setting stores (kebab-case), such as `heroui` or `acme-dark`. */
  readonly id: string;
  /** The label people pick it by. */
  readonly label: string;
  /** The theme the changes apply to, by name (`stackra`). */
  readonly base: string;
  /** The token-set version the changes were written against (ADR 0340 decision 6). */
  readonly tokenSet: number;
  /** `draft` while it is built and previewed, `published` once people may apply it. */
  readonly status: "draft" | "published";
  /** The changes over the base, the `stackra.theme-diff/2` `changes` object. */
  readonly changes: ThemeDiff;
}
