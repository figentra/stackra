/**
 * Stackra file contract:
 * Purpose: `checkIosFormFactor(path, text)`, STA-461: an Expo app config locks no orientation and never asks for
 *          `ios.requireFullScreen`, so the app takes any size and rotation (iPhone Duo, resizable iOS windows).
 * Boundary: pure; the text must be JSON.
 * Runtime: node
 * Governing contract: STA-461.
 */

/** The `expo` fields of an app config the check reads. */
type ExpoConfig = {
  readonly orientation?: unknown;
  readonly ios?: { readonly requireFullScreen?: unknown };
};

/**
 * The form-factor findings of one Expo app config.
 *
 * @param path - repository-relative, used in the findings.
 * @param text - the `app.json` contents.
 * @throws SyntaxError when `text` is not JSON.
 * @example
 * checkIosFormFactor("apps/m/app.json", '{"expo":{"orientation":"portrait"}}'); // one finding
 */
export function checkIosFormFactor(path: string, text: string): string[] {
  const expo = (JSON.parse(text) as { readonly expo?: ExpoConfig } | null)?.expo;
  if (!expo) return [];
  const out: string[] = [];
  if (expo.orientation !== undefined && expo.orientation !== "default")
    out.push(
      `${path}: "orientation": "${String(expo.orientation)}" locks the app; drop it or use "default" (STA-461)`,
    );
  if (expo.ios?.requireFullScreen === true)
    out.push(
      `${path}: "ios.requireFullScreen" refuses split views and resizable windows (STA-461)`,
    );
  return out;
}
