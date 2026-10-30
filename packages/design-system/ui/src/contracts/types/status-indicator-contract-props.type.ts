/**
 * Stackra file contract:
 * Purpose: the props every runtime's `StatusIndicator` takes: a state shown by colour, shape and icon together (a
 *          ringed check, a triangle, an octagon), so it never relies on colour alone, with a pulse for states that need
 *          attention.
 * Boundary: types only. The text still carries the meaning; the shape repeats it for colour-blind and glance reading
 *           (KDS tickets, floor tables).
 * Runtime: isomorphic
 * Governing contract: gap inventory row 30 (owner approval 2026-10-28, P1 + P2 core); ADR 0302 (decision 3); WCAG 2.2
 *                     SC 1.4.1 (use of colour).
 */
import type { Tone } from "@stackra/contracts";
import type { ReactNode } from "react";

import type { Size } from "#contracts/enums/size.enum";
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** Props shared by the web and native `StatusIndicator`. */
export interface StatusIndicatorContractProps {
  /** The state's name in the app's language ("Late", "Ready"); required because the shape alone is not a name. */
  readonly children: ReactNode;
  /** The state's role, which picks the colour and the shape. Defaults to `default`. */
  readonly tone?: Tone | undefined;
  /** An icon in place of the tone's shape. */
  readonly icon?: IconSlot | undefined;
  /** True for a state that needs attention now (a late order, an alarm): the shape pulses. */
  readonly isAttention?: boolean | undefined;
  /** The shape's and text's size. Defaults to `md`. */
  readonly size?: Size | undefined;
}
