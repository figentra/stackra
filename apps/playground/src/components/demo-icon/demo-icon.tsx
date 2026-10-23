/**
 * Stackra file contract:
 * Purpose: a small line icon for the Pro demo pages (navigation items, palette items, KPI cards), drawn inline so the
 *          playground needs no icon package; decorative, so hidden from assistive technology.
 * Boundary: presentation only; the name of the thing an icon sits beside always comes from its text.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0304 (decision 6); STA-403 FR-013.
 */

/** The path of each icon, drawn in a 16 by 16 box with a 1.5 stroke. */
const PATHS = {
  home: "M2 7.5 8 2l6 5.5V14H2z",
  chart: "M3 13V8m5 5V3m5 10V6",
  gear: "M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM8 1v2m0 10v2M1 8h2m10 0h2M3 3l1.4 1.4m7.2 7.2L13 13M13 3l-1.4 1.4M4.4 11.6 3 13",
  search: "M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm4-1 3.5 3.5",
  users:
    "M6 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM1.5 14c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4M11 3.2a2.5 2.5 0 0 1 0 4.6M12 10c1.7.3 2.5 1.6 2.5 4",
  doc: "M4 2h5l3 3v9H4zM9 2v3h3",
  money: "M8 1v14M11 4H6.5a2 2 0 0 0 0 4h3a2 2 0 0 1 0 4H5",
} as const;

/** The icons {@link DemoIcon} draws. */
export type DemoIconName = keyof typeof PATHS;

/** Props of {@link DemoIcon}. */
export interface DemoIconProps {
  /** Which icon to draw. */
  name: DemoIconName;
}

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
      <path d={PATHS[name]} />
    </svg>
  );
}
