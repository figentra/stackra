/**
 * Stackra file contract:
 * Purpose: `SurfaceKind`, the frame a landing surface is drawn in: a web window, a desktop window or a phone.
 * Boundary: an `Enum.of` value plus the type of the same name; codes are snake_case and never shown as words.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0231 (snake_case codes); STA-2041.
 */
import { Enum } from "@stackra/contracts";

/** The frames a surface is drawn in. */
export const SurfaceKind = Enum.of({
  /** A browser window. */
  Web: "web",
  /** A desktop app window. */
  Desktop: "desktop",
  /** A phone. */
  Phone: "phone",
});

/** One of the codes above. */
export type SurfaceKind = Enum.Value<typeof SurfaceKind>;
