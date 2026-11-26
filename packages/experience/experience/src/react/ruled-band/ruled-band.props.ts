/**
 * Stackra file contract:
 * Purpose: `RuledBandProps`, what a landing block hands the RuledBand: the band's anchor, its spoken name, its
 *          padding and its content.
 * Boundary: an interface in its own file beside the component (ADR 0305). Internal to the `./react` entry.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`); STA-2041.
 */
import type { ReactNode } from "react";

/**
 * One ruled band of the landing's column.
 *
 * @example
 * <RuledBand label="stackra"><MonoDisplay … /></RuledBand>
 */
export interface RuledBandProps {
  /** The section's id, a dock's link target. */
  readonly id?: string | undefined;
  /** The section's spoken name; given, the band is a named region. */
  readonly label?: string | undefined;
  /** The block the band holds. */
  readonly children: ReactNode;
  /** Styles the band; given, it replaces the landing's band padding (the hero's rhythm). */
  readonly className?: string | undefined;
}
