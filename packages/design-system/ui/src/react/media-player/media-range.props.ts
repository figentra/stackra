/**
 * Stackra file contract:
 * Purpose: `MediaRangeProps`, the props of the MediaPlayer's internal `MediaRange` (the timeline and the volume): the
 *          shared contract.
 * Boundary: types only; internal to the media player.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { MediaRangeContractProps } from "#contracts/types/media-range-contract-props.type";

/** Props of a MediaRange. */
export type MediaRangeProps = MediaRangeContractProps;
