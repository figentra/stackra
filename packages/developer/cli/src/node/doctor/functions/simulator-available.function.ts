/**
 * Stackra file contract:
 * Purpose: `simulatorAvailable(json)`, whether `xcrun simctl list devices --json` lists at least one available iOS
 *          simulator.
 * Boundary: pure; parses output it is given.
 * Runtime: node
 * Governing contract: STA-1952 spec User Story 0.
 */

/**
 * Whether an available simulator exists.
 *
 * @param json - the parsed `xcrun simctl list devices --json` output, or null.
 * @example
 * simulatorAvailable({ devices: { "com.apple.CoreSimulator.SimRuntime.iOS-18-0": [{ isAvailable: true }] } }); // true
 */
export function simulatorAvailable(
  json:
    | { readonly devices?: Readonly<Record<string, readonly { readonly isAvailable?: boolean }[]>> }
    | null
    | undefined,
): boolean {
  return Object.entries(json?.devices ?? {}).some(
    ([runtime, devices]) =>
      runtime.includes(".iOS-") && devices.some((device) => device.isAvailable),
  );
}
