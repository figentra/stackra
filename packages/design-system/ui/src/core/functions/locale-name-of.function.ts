/**
 * Stackra file contract:
 * Purpose: `localeNameOf(tag)`, a language's own name for itself ("العربية", "English", "Français"), first letter
 *          capitalised the way its own language does, for a LocaleSwitcher.
 * Boundary: pure; Intl.DisplayNames; the tag itself when Intl does not know it.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0403.
 */

/**
 * A language's own name.
 * @param tag - a BCP 47 tag
 * @returns the name in that language
 */
export function localeNameOf(tag: string): string {
  try {
    const name = new Intl.DisplayNames([tag], { type: "language" }).of(tag) ?? tag;
    return name.charAt(0).toLocaleUpperCase(tag) + name.slice(1);
  } catch {
    return tag;
  }
}
