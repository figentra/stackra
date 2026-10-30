/**
 * Stackra file contract:
 * Purpose: `angleOfKey(key, value, step, isShift)`, the angle an AngleSlider moves to on a key: → and ↑ turn one step
 *          clockwise, ← and ↓ one step back, Shift or Page Up/Down fifteen steps, Home 0 and End the last step before a
 *          full turn; the angle wraps. Any other key is `undefined`.
 * Boundary: pure. Not mirrored in right-to-left: an angle is absolute, so → always turns clockwise.
 * Runtime: isomorphic
 * Governing contract: WAI-ARIA APG slider pattern; STA-1371 (wave D, owner approval 2026-10-30).
 */
import { snapAngle } from "#core/functions/snap-angle.function";

/** The steps each key turns. */
const KEY_STEPS: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowUp: 1,
  ArrowLeft: -1,
  ArrowDown: -1,
  PageUp: 15,
  PageDown: -15,
};

/**
 * The angle after `key`.
 * @example angleOfKey("ArrowRight", 350, 15, false); // 0
 */
export function angleOfKey(
  key: string,
  value: number,
  step: number,
  isShift: boolean,
): number | undefined {
  const grid = Math.max(1, step);
  if (key === "Home") return 0;
  if (key === "End") return 360 - grid;
  const steps = KEY_STEPS[key];
  if (steps === undefined) return undefined;
  const times = isShift && Math.abs(steps) === 1 ? 15 : 1;
  return snapAngle(value + steps * times * grid, grid);
}
