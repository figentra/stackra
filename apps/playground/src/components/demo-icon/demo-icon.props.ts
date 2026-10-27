/**
 * Stackra file contract:
 * Purpose: `DemoIconProps`: props of `DemoIcon`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { DemoIconName } from "./demo-icon-name.type";

/** Props of {@link DemoIcon}. */
export interface DemoIconProps {
  /** Which icon to draw. */
  name: DemoIconName;
}
