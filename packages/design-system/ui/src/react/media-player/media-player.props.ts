/**
 * Stackra file contract:
 * Purpose: `MediaPlayerProps`, the props of the web `MediaPlayer`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { MediaPlayerContractProps } from "#contracts/types/media-player-contract-props.type";

/** Props of the web MediaPlayer. */
export type MediaPlayerProps = MediaPlayerContractProps & {
  /** Styles the outer element. */
  readonly className?: string | undefined;
};
