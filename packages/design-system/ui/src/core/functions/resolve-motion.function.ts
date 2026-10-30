/**
 * Stackra file contract:
 * Purpose: the motion level in force: the one the user picked, lowered from `full` to `reduced` when the operating
 *          system asks for reduced motion. The system never raises a level.
 * Boundary: pure; each provider reads the system setting and passes it in.
 * Runtime: isomorphic
 * Governing contract: ADR 0329 (motion layer); WCAG 2.2 SC 2.3.3.
 */
import type { MotionLevel } from "#contracts/enums/motion-level.enum";

/**
 * The motion level in force.
 * @param picked - the level the user or the app picked
 * @param isSystemReduced - true when the operating system asks for reduced motion
 * @returns `reduced` for `full` under the system setting, else `picked`
 */
export function resolveMotion(picked: MotionLevel, isSystemReduced: boolean): MotionLevel {
  return picked === "full" && isSystemReduced ? "reduced" : picked;
}
