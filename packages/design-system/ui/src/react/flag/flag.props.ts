/**
 * Stackra file contract:
 * Purpose: `FlagProps`, the props of the web `Flag` in `flag.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); STA-1981.
 */

/** Props of the web Flag. */
export interface FlagProps {
  /**
   * An ISO 3166-1 alpha-2 country code (`sa`), or a language tag with a region (`ar-SA`), which shows the region's flag.
   * A code with no flag shows the code itself.
   */
  readonly code: string;
  /** The accessible name, for example the country's name; without it the flag is decorative and hidden from assistive technology. */
  readonly label?: string | undefined;
  /** The size. Defaults to `md`. */
  readonly size?: "sm" | "md" | "lg" | undefined;
  /** Styles the root. */
  readonly className?: string | undefined;
}
