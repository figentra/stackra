/**
 * Stackra file contract:
 * Purpose: `MediaPlayerProps`, the props of the native `MediaPlayer`: the shared contract and a class name.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); STA-1371 (owner approval
 *          2026-10-30).
 */
import type { MediaPlayerContractProps } from "#contracts/types/media-player-contract-props.type";

/** Props of the native MediaPlayer. */
export type MediaPlayerProps = MediaPlayerContractProps & {
  /** Styles the outer element. */
  readonly className?: string | undefined;
};
