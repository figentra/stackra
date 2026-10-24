/**
 * Stackra file contract:
 * Purpose: the brand icon a page category wears, in the gallery's panels and the command palette's rows: one of the
 *          kit's glyphs per category, the module glyph for a category not named here, so a new category needs no edit.
 * Boundary: decoration only (`aria-hidden`); the category's name is always written beside it.
 * Runtime: browser
 * Governing contract: ADR 0320 (the showcase stage); the stackra brand kit.
 */
import { BrandGlyph, type BrandGlyphName } from "#src/components/brand-glyph";

/** The brand icon each category wears; a category missing here wears the module icon. */
const CATEGORY_GLYPHS: Readonly<Record<string, BrandGlyphName>> = {
  Foundations: "token",
  Actions: "pipeline",
  Typography: "docs",
  Navigation: "link",
  Surfaces: "module",
  Status: "alert",
  Inputs: "terminal",
  Selection: "check",
  Forms: "schema",
  Overlays: "package",
  Feedback: "alert",
  Data: "graph",
  Shell: "provider",
  "Inputs and forms": "terminal",
  "Date and time": "schema",
  Charts: "graph",
  "Data display": "module",
  "Feedback and status": "alert",
  Layout: "menu",
  AI: "pipeline",
};

/** Props of {@link CategoryGlyph}. */
export interface CategoryGlyphProps {
  /** The category, by name. */
  category: string;
  /** Sizing and colour classes. */
  className?: string;
}

/** The brand icon of `category`. */
export function CategoryGlyph({ category, className }: CategoryGlyphProps) {
  return (
    <BrandGlyph
      name={CATEGORY_GLYPHS[category] ?? "module"}
      {...(className ? { className } : {})}
    />
  );
}
