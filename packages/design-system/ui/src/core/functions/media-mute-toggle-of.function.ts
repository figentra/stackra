/**
 * Stackra file contract:
 * Purpose: `mediaMuteToggleOf(state)`, what the mute button does: a silent player (muted, or at zero volume) unmutes,
 *          and comes back at full volume when it was at zero, since unmuting at zero would stay silent; a playing one
 *          mutes and keeps its volume.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */

/**
 * The volume and mute after a press of the mute button.
 * @example mediaMuteToggleOf({ volume: 0, isMuted: true }); // { volume: 1, isMuted: false }
 */
export function mediaMuteToggleOf(state: { readonly volume: number; readonly isMuted: boolean }): {
  readonly volume: number;
  readonly isMuted: boolean;
} {
  const isSilent = state.isMuted || state.volume === 0;
  return { volume: state.volume === 0 ? 1 : state.volume, isMuted: !isSilent };
}
