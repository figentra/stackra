/**
 * Stackra file contract:
 * Purpose: `checkWindowSizing(path, text)`, STA-461: an app reads its size from the window it is given, never from the device.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: STA-461.
 */

/**
 * The window-sizing findings of one app source file.
 *
 * @param path - repository-relative, used in the findings.
 * @param text - the file's contents.
 * @example
 * checkWindowSizing("apps/m/src/a.tsx", "Dimensions.get('window')"); // one finding
 */
export function checkWindowSizing(path: string, text: string): string[] {
  return /\bDimensions\.get\(/.test(text)
    ? [
        `${path}: Dimensions.get reads the device, not the window; use useWindowDimensions (STA-461)`,
      ]
    : [];
}
