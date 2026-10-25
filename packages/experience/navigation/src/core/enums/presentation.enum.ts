/**
 * Stackra file contract:
 * Purpose: `Presentation`, how a native route is shown over the one below it: pushed, a sheet with detents (a modal on
 *          Android), or full screen (`Route({ presentation })`).
 * Boundary: codes only; a route that sets none is pushed. The generated React Navigation tree maps them to screen
 *           options.
 * Runtime: isomorphic
 * Governing contract: ADR 0165 (React Navigation on mobile); ADR 0128 (`Enum.of`, no `enum`).
 */
import { Enum } from "@stackra/contracts";

/** The presentations of a native route. */
export const Presentation = Enum.of({
  /** Pushed on the stack; the default. */
  Push: "push",
  /** A sheet with detents on iOS, a modal on Android. */
  Sheet: "sheet",
  /** Over everything, with a transparent header. */
  FullScreen: "full_screen",
});

/** One of the codes above. */
export type Presentation = Enum.Value<typeof Presentation>;
