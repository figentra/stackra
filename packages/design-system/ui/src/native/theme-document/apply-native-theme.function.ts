/**
 * Stackra file contract:
 * Purpose: `applyNativeTheme`, the native side of a theme as data (ADR 0501 section 5): validates a stored theme
 *          document, pushes its HeroUI roles, palette and layout variables to each Uniwind theme at runtime, and
 *          returns the theme's numbers (`nativeTokens`) for the parts a class cannot reach. The appearance settings
 *          call it with the document the person or tenant picked; nothing rebuilds.
 * Boundary: pushes to Uniwind only. A value Uniwind's runtime cannot read (a shadow list, a `var()` or `calc()`
 *           reference) is left to the built stylesheet; lengths go as px numbers, colours as written. No settings
 *           dependency.
 * Runtime: react-native
 * Governing contract: ADR 0501 (tokens v2, section 5); ADR 0165 (HeroUI Native and Uniwind).
 */
import { nativeTokens, parseThemeDocument, STACKRA_THEME, themeVariables } from "@stackra/tokens";
import type { NativeTokens, Theme } from "@stackra/tokens/contracts";
import { Uniwind } from "uniwind";

const LENGTH = /^(-?[\d.]+)(px|rem)$/;

/** A web variable's value as Uniwind's runtime takes it, or `undefined` for one only its build can convert. */
function runtimeValue(name: string, value: string): string | number | undefined {
  if (name.endsWith("-shadow") || /\b(var|calc|color-mix|clamp|min|max)\(/.test(value))
    return undefined;
  const length = LENGTH.exec(value);
  return length ? Number(length[1]) * (length[2] === "rem" ? 16 : 1) : value;
}

/** `variables` as Uniwind's runtime takes them. */
const runtime = (variables: Readonly<Record<string, string>>) =>
  Object.fromEntries(
    Object.entries(variables).flatMap(([name, value]) => {
      const converted = runtimeValue(name, value);
      return converted === undefined ? [] : [[name, converted] as const];
    }),
  );

/**
 * Applies `input` to the running app and returns its theme and numbers.
 * @param input - a stored theme document (`stackra.theme-document/1`), as JSON-parsed data
 * @param base - the theme the document's changes apply to, Stackra's by default
 * @throws InvalidThemeError when the document is not a usable theme; the app keeps its theme
 */
export function applyNativeTheme(
  input: unknown,
  base: Theme = STACKRA_THEME,
): { readonly theme: Theme; readonly tokens: NativeTokens } {
  const { theme } = parseThemeDocument(input, base);
  const { heroui, stackra } = themeVariables(theme);
  for (const mode of ["light", "dark"] as const)
    Uniwind.updateCSSVariables(
      mode,
      runtime({ ...stackra[mode], ...heroui.root, ...stackra.root, ...heroui[mode] }),
    );
  return { theme, tokens: nativeTokens(theme) };
}
