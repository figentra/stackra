/**
 * Stackra file contract:
 * Purpose: `HeaderStyle`, the header a native screen shows: the standard bar, a large title that collapses on scroll
 *          (tab roots), or none (`Route({ chrome: { header } })`, `ChromeConfig.header.style`).
 * Boundary: codes only; the generated React Navigation tree maps them to its screen options.
 * Runtime: isomorphic
 * Governing contract: ADR 0165 (React Navigation on mobile); ADR 0128 (`Enum.of`, no `enum`).
 */
import { Enum } from "@stackra/contracts";

/** The header styles of a native screen. */
export const HeaderStyle = Enum.of({
  /** The standard bar with the title. */
  Default: "default",
  /** A large title that collapses into the bar on scroll. */
  Large: "large",
  /** No header. */
  Hidden: "hidden",
});

/** One of the codes above. */
export type HeaderStyle = Enum.Value<typeof HeaderStyle>;
