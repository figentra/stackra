/**
 * Stackra file contract:
 * Purpose: `installPluralRules()`: where the host has no `Intl.PluralRules` (Hermes on iOS), installs a small one with
 *          the CLDR rules of Arabic and English, so ICU `plural` and `selectordinal` messages format instead of throwing.
 * Boundary: touches the global `Intl` only when `PluralRules` is missing; a host that has it is left alone.
 * Runtime: isomorphic
 * Governing contract: ADR 0268 (R15: ICU syntax), ADR 0080; CLDR plural rules (ar, en).
 */

/** Installs the fallback `Intl.PluralRules` once, when the host lacks it. */
// shortcut: Arabic and English rules only (other languages get English's one/other); install
// @formatjs/intl-pluralrules once a third language ships on a host without Intl.PluralRules.
export function installPluralRules(): void {
  if (typeof Intl.PluralRules === "function") return;
  (Intl as { PluralRules: unknown }).PluralRules = class {
    private readonly language: string;

    private readonly type: Intl.PluralRuleType;

    constructor(locales?: string | readonly string[], options?: Intl.PluralRulesOptions) {
      const tag = (Array.isArray(locales) ? locales[0] : locales) ?? "en";
      this.language = String(tag).toLowerCase().split(/[-_]/)[0] ?? "en";
      this.type = options?.type ?? "cardinal";
    }

    static supportedLocalesOf(locales?: string | readonly string[]): string[] {
      return [locales ?? []].flat();
    }

    select(value: number): Intl.LDMLPluralRule {
      const n = Math.abs(value);
      const isInteger = Number.isInteger(n);
      if (this.language === "ar") {
        if (this.type === "ordinal" || !isInteger) return "other";
        const tail = n % 100;
        if (n === 0) return "zero";
        if (n === 1) return "one";
        if (n === 2) return "two";
        if (tail >= 3 && tail <= 10) return "few";
        if (tail >= 11) return "many";
        return "other";
      }
      if (this.type === "ordinal") {
        const [ten, hundred] = [n % 10, n % 100];
        if (ten === 1 && hundred !== 11) return "one";
        if (ten === 2 && hundred !== 12) return "two";
        if (ten === 3 && hundred !== 13) return "few";
        return "other";
      }
      return n === 1 && isInteger ? "one" : "other";
    }

    resolvedOptions() {
      return { locale: this.language, type: this.type };
    }
  };
}
