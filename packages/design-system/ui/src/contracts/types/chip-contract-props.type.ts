/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Chip` takes: the text, variant, size, tone and the start and end icons of a
 *          compact, non-interactive label. Each runtime's `ChipProps` is this plus its HeroUI chip's own props, which
 *          pass through unchanged, press handlers excepted.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0165 (UI contract); ADR 0303 (decision 7,
 *          props vocabulary); ADR 0304.
 */
import type { Tone } from "@stackra/contracts";
import type { ReactNode } from "react";

import type { ChipVariant } from "#contracts/enums/chip-variant.enum";
import type { Size } from "#contracts/enums/size.enum";
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** Props shared by the web and native `Chip`. */
export interface ChipContractProps {
  /** The visible text, usually a string; it is also what assistive technology reads. */
  readonly children: ReactNode;
  /** The emphasis of the chip: filled, neutral, transparent or tinted. Defaults to `secondary`. */
  readonly variant?: ChipVariant | undefined;
  /** The padding and text size of the chip. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** The colour role of the chip, a theme role such as `success`. Defaults to `default`. */
  readonly tone?: Tone | undefined;
  /** An element drawn before the text, on the inline-start side: an icon name or any icon element, sized to the text. */
  readonly startIcon?: IconSlot;
  /** An element drawn after the text, on the inline-end side: an icon name or any icon element, sized to the text. */
  readonly endIcon?: IconSlot;
}
