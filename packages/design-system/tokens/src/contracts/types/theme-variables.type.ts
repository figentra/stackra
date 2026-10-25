/**
 * Stackra file contract:
 * Purpose: a theme as the CSS custom properties it renders to on the web, split by owner: `heroui` holds the
 *          properties HeroUI v3 itself defines and reads (the colour roles, the three shadows, `--radius` and
 *          `--field-radius`), `stackra` the system's additions (palette, fonts, type, spacing, radius steps, motion and
 *          the glass material). Each owner has the mode-independent set (`root`) and one per colour mode.
 * Boundary: types only; every key is a property name with its leading `--`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0165 (HeroUI v3 on the web).
 */

/** The custom properties of one owner: those that hold in both modes, and those of each mode. */
interface VariableSet {
  /** Properties that hold in both colour modes. */
  readonly root: Readonly<Record<string, string>>;
  /** Properties of the light mode. */
  readonly light: Readonly<Record<string, string>>;
  /** Properties of the dark mode. */
  readonly dark: Readonly<Record<string, string>>;
}

/** A theme's web custom properties: HeroUI's own and Stackra's additions. */
export interface ThemeVariables {
  /** The properties HeroUI v3 defines and its components read. */
  readonly heroui: VariableSet;
  /** The properties the Stackra Design System adds. */
  readonly stackra: VariableSet;
}
