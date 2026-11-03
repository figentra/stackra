/**
 * Stackra file contract:
 * Purpose: `TerminalStageProps`, what a page hands the TerminalStage: the command, its recorded session, the
 *          band of art under it and the monitor drawing it ends on.
 * Boundary: an interface in its own file beside the component (ADR 0305). The recording, the words and the art URLs
 *           are page content; the block imports no drawing.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`); STA-2041.
 */
import type { TerminalLine } from "@stackra/ui/contracts";
import type { DitherArtProps } from "@stackra/ui/react";
import type { ReactNode } from "react";

/**
 * The try-it terminal on its horizon.
 *
 * @example
 * <TerminalStage command="stackra create my-app" lines={recording}
 *   monitor={{ src: "art/monitor", width: 328, height: 426 }} />
 */
export interface TerminalStageProps {
  /** The command in the terminal's top bar, which its copy button copies. */
  readonly command: string;
  /** The recorded session, played a whole line at a time; empty until it is recorded, which draws no log. */
  readonly lines: readonly TerminalLine[];
  /** The dithered band under the terminal; it fades toward the top and draws in the tile line by default. */
  readonly art?: DitherArtProps | undefined;
  /** The terminal's mono label and spoken name, such as "Try it". */
  readonly label?: string | undefined;
  /** What the session ends on inside the terminal, such as a framed localhost preview. */
  readonly result?: ReactNode;
  /**
   * The monitor drawing under the terminal, drawn by `Illustration` once the session has played: the base URL of its
   * tone layers (`art/monitor`), its viewBox size for the aspect ratio, and `alt`, without which it is decorative.
   */
  readonly monitor?:
    | {
        readonly src: string;
        readonly width: number;
        readonly height: number;
        readonly alt?: string | undefined;
      }
    | undefined;
  /** Styles the block. */
  readonly className?: string | undefined;
}
