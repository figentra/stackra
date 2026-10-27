/**
 * Stackra file contract:
 * Purpose: a small line icon for the Pro demo pages (navigation items, palette items, KPI cards), drawn inline so the
 *          playground needs no icon package; decorative, so hidden from assistive technology.
 * Boundary: presentation only; the name of the thing an icon sits beside always comes from its text.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6); STA-403 FR-013.
 */
import type { DemoIconProps } from "./demo-icon.props";
import { DEMO_ICON_PATHS } from "./demo-icon-paths.constant";

/** A decorative 1rem line icon in the current text colour. */
export function DemoIcon({ name }: DemoIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0"
      data-icon={name}
    >
      <path d={DEMO_ICON_PATHS[name]} />
    </svg>
  );
}
