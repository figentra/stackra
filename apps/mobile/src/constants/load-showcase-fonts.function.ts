/**
 * Stackra file contract:
 * Purpose: `loadShowcaseFonts`: registers the Figentra faces vendored in `assets/fonts` (Geist, Geist Mono and IBM
 *          Plex Sans Arabic, OFL) with `expo-font`, so a style can name them (`fontFamily: "Geist"`,
 *          `"IBMPlexSansArabic"` for Arabic text, the native side of the web `:lang(ar)` rule).
 * Boundary: loading only; nothing here sets a face on a component. `expo-font` is required on first use: until the app
 *           lists it (`expo-font: catalog:mobile`, the owner's catalog entry), Metro leaves the optional require out
 *           and the app draws in the system face, as before. Resolves either way; never throws.
 * Runtime: react-native
 * Governing contract: ADR 0340 (decision 2, brand faces); ADR 0060 (Arabic and RTL).
 */

/** The faces by the family name a style uses. */
const FACES = {
  Geist: require("../../assets/fonts/Geist-Regular.ttf"),
  "Geist-Medium": require("../../assets/fonts/Geist-Medium.ttf"),
  "Geist-SemiBold": require("../../assets/fonts/Geist-SemiBold.ttf"),
  "Geist-Bold": require("../../assets/fonts/Geist-Bold.ttf"),
  GeistMono: require("../../assets/fonts/GeistMono-Regular.ttf"),
  "GeistMono-Medium": require("../../assets/fonts/GeistMono-Medium.ttf"),
  IBMPlexSansArabic: require("../../assets/fonts/IBMPlexSansArabic-Regular.ttf"),
  "IBMPlexSansArabic-Medium": require("../../assets/fonts/IBMPlexSansArabic-Medium.ttf"),
  "IBMPlexSansArabic-SemiBold": require("../../assets/fonts/IBMPlexSansArabic-SemiBold.ttf"),
  "IBMPlexSansArabic-Bold": require("../../assets/fonts/IBMPlexSansArabic-Bold.ttf"),
} as const;

/**
 * Loads the showcase faces.
 * @returns whether they were registered (`false` without `expo-font` or when loading failed)
 */
export async function loadShowcaseFonts(): Promise<boolean> {
  try {
    // oxlint-disable-next-line typescript/no-require-imports -- optional until the catalog lists expo-font; Metro drops an unresolved require in a try
    const { loadAsync } = require("expo-font") as {
      loadAsync: (faces: Record<string, unknown>) => Promise<void>;
    };
    await loadAsync(FACES);
    return true;
  } catch {
    return false;
  }
}
