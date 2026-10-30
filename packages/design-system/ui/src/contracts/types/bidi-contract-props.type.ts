/**
 * Stackra file contract:
 * Purpose: `BidiContractProps`, the props shared by the web and native `Bidi`: a run of text isolated from the text
 *          around it, or a block whose direction is set locally.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 1 (owner choice "P1 + P2 core", 2026-10-28); ADR 0060
 *          (right-to-left); ADR 0305 (one declaration per file).
 */
import type { ReactNode } from "react";

import type { Direction } from "#contracts/enums/direction.enum";

/** Props shared by the web and native `Bidi`. */
export interface BidiContractProps {
  /** The text to isolate, or the block's content: a SKU, a phone number, an e-mail, a Latin name in Arabic text. */
  readonly children: ReactNode;
  /** The direction of the content; `auto` (the default) takes it from the first strong letter. */
  readonly dir?: Direction | "auto" | undefined;
  /** True for a block that sets the direction of everything inside it (arrow keys and placement too); false (the
   *  default) for an inline run that only stops its own direction leaking into the sentence around it. */
  readonly isBlock?: boolean | undefined;
}
