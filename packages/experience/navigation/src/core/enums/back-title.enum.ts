/**
 * Stackra file contract:
 * Purpose: `BackTitle`, how a native header's back button labels itself: the previous screen's title, a generic
 *          "Back", or the arrow alone (`ChromeConfig.header.backTitle`).
 * Boundary: codes only; the generated React Navigation tree maps them to `headerBackButtonDisplayMode`.
 * Runtime: isomorphic
 * Governing contract: ADR 0165 (React Navigation on mobile); ADR 0128 (`Enum.of`, no `enum`).
 */
import { Enum } from "@stackra/contracts";

/** The back-button labels of a native header. */
export const BackTitle = Enum.of({
  /** The previous screen's title, shortened by the platform when it does not fit. */
  Default: "default",
  /** A generic "Back" in the user's language. */
  Generic: "generic",
  /** The arrow alone. */
  Minimal: "minimal",
});

/** One of the codes above. */
export type BackTitle = Enum.Value<typeof BackTitle>;
