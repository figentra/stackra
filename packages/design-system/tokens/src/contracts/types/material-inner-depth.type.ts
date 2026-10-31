/**
 * Stackra file contract:
 * Purpose: `MaterialInnerDepth`: the inner shadow that gives glass its thickness, drawn along the lower inside edge.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (the glass material); ADR 0501 (tokens v2, the materials block).
 */
import type { ModeShare } from "#contracts/types/mode-share.type";

/** The inner shadow that gives glass its thickness. */
export interface MaterialInnerDepth {
  /** How far up from the lower edge, a px length. */
  readonly y: string;
  /** The shadow's blur, a px length. */
  readonly blur: string;
  /** How much black, per colour scheme, 0 to 1. */
  readonly alpha: ModeShare;
}
