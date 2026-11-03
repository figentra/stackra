/**
 * Stackra file contract:
 * Purpose: `TerminalDemoProps`, the props of the web `TerminalDemo` in `terminal-demo.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); STA-2041.
 */
import type { ReactNode } from "react";

import type { TerminalLine } from "#contracts/types/terminal-line.type";

/** Props of the web TerminalDemo. */
export interface TerminalDemoProps {
  /** The command in the top bar, which the copy button copies, such as `stackra create my-app`. */
  readonly command: string;
  /** The mono label in the top bar, and the region's spoken name. Defaults to "Try it". */
  readonly label?: string | undefined;
  /** The recorded session, played a whole line at a time. */
  readonly lines: readonly TerminalLine[];
  /** What the session ends on, such as a framed localhost preview; shown once every line is. */
  readonly result?: ReactNode;
  /** When the session plays: once it scrolls into view (the default), at once, or `never` (the last frame only). */
  readonly autoplay?: "in-view" | "always" | "never" | undefined;
  /** The time between lines in milliseconds, the motion kit's floor step. Defaults to 80. */
  readonly stepMs?: number | undefined;
  /** Shows the copy button. Defaults to true. */
  readonly isCopyable?: boolean | undefined;
  /** The copy button's spoken name. Defaults to "Copy command". */
  readonly copyLabel?: string | undefined;
  /** Styles the window. */
  readonly className?: string | undefined;
}
