/**
 * Stackra file contract:
 * Purpose: `ExpoAppIconModule`, the slice of expo-alternate-app-icons `ExpoAppIconDriver` calls, which the driver
 *          imports and a test subclass replaces with a fake.
 * Boundary: a type only. `null` reads the library as absent: the device cannot change its icon.
 * Runtime: react-native
 * Governing contract: ADR 0250 (decision 2); ADR 0478 (a maintained Expo library, no hand-written native code).
 */

/**
 * The app icon library.
 *
 * @example
 * class FakeAppIcon extends ExpoAppIconDriver {
 *   protected override readonly module: ExpoAppIconModule = null;
 * }
 */
export type ExpoAppIconModule = {
  /** Whether this device supports alternate icons. */
  readonly supportsAlternateIcons: boolean;
  /** The alternate icon showing now; `null` is the default. */
  readonly getAppIconName: () => string | null;
  /** Shows the alternate icon `name`, or the default for `null`; resolves the icon now showing. */
  readonly setAlternateAppIcon: (name: string | null) => Promise<string | null>;
} | null;
