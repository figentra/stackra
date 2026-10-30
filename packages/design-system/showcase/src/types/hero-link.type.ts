/**
 * Stackra file contract:
 * Purpose: `HeroLink`, where an entry's HeroUI counterpart is documented. URLs are data, never derived in UI code.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 6; ADR 0305 (one declaration per file).
 */

/** The HeroUI counterpart of an entry on one platform. */
export interface HeroLink {
  /** The free HeroUI package the counterpart ships in (no HeroUI Pro, ADR 0469). */
  readonly pkg: "@heroui/react" | "heroui-native";
  /** HeroUI's own slug ("text-field"), which may differ from ours ("input"). */
  readonly slug: string;
  /** The docs page; undefined hides the link. */
  readonly docsUrl?: string;
  /** The HeroUI source on GitHub. */
  readonly sourceUrl?: string;
  /** The React Aria page (react only). */
  readonly racUrl?: string;
  /** The Figma frame. */
  readonly figmaUrl?: string;
}
