/**
 * Stackra file contract:
 * Purpose: `HeroProps`: props of each landing hero (`StackHero`, `StormHero`, `MirrorHero`) and of `LandingHero`.
 * Boundary: a type only, in its own file beside the components.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */

/** Props of a landing hero. */
export interface HeroProps {
  /** "Browse components": brings the category tabs into view. */
  onBrowse: () => void;
  /** Opens the theme settings. */
  onTheme: () => void;
}
