/**
 * Stackra file contract:
 * Purpose: how many dots of a determinate dot loader a value fills.
 * Boundary: pure maths.
 * Runtime: isomorphic
 * Governing contract: .agents/specs/sta-2017-dot-loader/spec.md (FR-001)
 */

/**
 * The dots of `count` that `value` fills between `minValue` and `maxValue`, rounded up so any progress shows a dot.
 * The value is held to the range; an empty range fills nothing.
 */
export function dotLoaderFilled(
  value: number,
  minValue: number,
  maxValue: number,
  count: number,
): number {
  if (!(maxValue > minValue) || count <= 0) return 0;
  const share = (Math.min(Math.max(value, minValue), maxValue) - minValue) / (maxValue - minValue);
  return Math.min(count, Math.ceil(share * count));
}
