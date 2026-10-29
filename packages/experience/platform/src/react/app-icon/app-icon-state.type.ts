/**
 * Stackra file contract:
 * Purpose: `AppIconState`, what `useAppIcon()` hands a settings screen or a brand switcher: the icon showing, the
 *          icons the build carries, whether the device can switch, and the switch.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 2); ADR 0294 (decision 17).
 */
import type { CapabilityResult } from "#contracts/types/capability-result.type";

/**
 * The app icon, for a component.
 *
 * @example
 * const appIcon = useAppIcon();
 * appIcon?.icons.map((name) => <Radio key={name} value={name} />);
 */
export interface AppIconState {
  /** The alternate icon showing now; `null` is the default icon. */
  readonly icon: string | null;
  /** The alternate icons this build carries, from `AppIconConfig`. */
  readonly icons: readonly string[];
  /** Whether this device lets the app change its icon. */
  readonly isSupported: boolean;
  /** Shows `name`, or the default for `null`; refuses `unavailable` for a name the build does not carry. */
  readonly set: (name: string | null) => Promise<CapabilityResult>;
}
