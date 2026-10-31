/**
 * Stackra file contract:
 * Purpose: `STACKRA_THEME`, the look of a Stackra CLI and the default of `createConsole`: the stackra wordmark in
 *          ASCII, a gradient from steel-500 to steel, the steel-500 accent and the stack glyph; on a dark ground the
 *          gradient runs from the dark-ground accent to steel and the accent is the dark-ground accent.
 * Boundary: data only; colours copied from the brand kit's `brands/stackra/tokens/color.json` (steel-500 #647384,
 *           graphite-300 #BABEC3, steel #E2E9F0) and its README (accent on dark #A7B6C7). All hue-less. Other products build their own theme with `themeFromBrandTokens`.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-016 and FR-017; brand kit stackra (rules §31: steel is a neutral).
 */
import type { ConsoleTheme } from "#contracts/types/console-theme.type";

/** The Stackra theme. */
export const STACKRA_THEME: ConsoleTheme = Object.freeze({
  name: "Stackra",
  logo: Object.freeze([
    "      _                 _",
    " ___ | |_   __ _   ___ | | __ _ __   __ _",
    "/ __|| __| / _` | / __|| |/ /| '__| / _` |",
    "\\__ \\| |_ | (_| || (__ |   < | |   | (_| |",
    "|___/ \\__| \\__,_| \\___||_|\\_\\|_|    \\__,_|",
  ]),
  gradient: Object.freeze(["#647384", "#BABEC3", "#E2E9F0"]),
  accent: "#647384",
  dark: Object.freeze({ gradient: Object.freeze(["#A7B6C7", "#E2E9F0"]), accent: "#A7B6C7" }),
  glyph: "≡",
  asciiGlyph: "=",
});
