/**
 * Stackra file contract:
 * Purpose: counts a number from one value to another over a duration, easing out, calling back on every animation
 *          frame and once more with the exact end value; returns a function that stops it.
 * Boundary: schedules with `requestAnimationFrame`, which browsers and React Native both have, and reads time from
 *           the frame's own timestamp. A duration of 0 or less jumps to the end at once.
 * Runtime: isomorphic
 * Governing contract: ADR 0329 (motion layer).
 */

/**
 * Counts from `from` to `to`.
 * @param from - the start value
 * @param to - the end value
 * @param durationMs - how long the count takes
 * @param onFrame - called with the value of each frame, last with `to`
 * @returns a function that stops the count where it is
 */
export function tweenNumber(
  from: number,
  to: number,
  durationMs: number,
  onFrame: (value: number) => void,
): () => void {
  if (durationMs <= 0 || from === to) {
    onFrame(to);
    return () => undefined;
  }
  let start: number | undefined;
  let frame = 0;
  const step = (time: number) => {
    start ??= time;
    const progress = Math.min(1, (time - start) / durationMs);
    // Ease-out cubic: fast at first, settling on the value.
    onFrame(progress === 1 ? to : from + (to - from) * (1 - (1 - progress) ** 3));
    if (progress < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}
