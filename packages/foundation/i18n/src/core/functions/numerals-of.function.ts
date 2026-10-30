/**
 * Stackra file contract:
 * Purpose: `numeralsOf(tag)`, the numbering system a locale tag asks for through its `-u-nu-` keyword (`ar-u-nu-arab`
 *          → `arab`), so a formatter handed only a tag (an `intlLocale` result, React Aria's locale) writes the digits
 *          the tag names even where the engine ignores the keyword (Hermes on iOS).
 * Boundary: pure; reads the Unicode extension only. A tag without `nu`, or with a system other than `latn` or `arab`,
 *           is `user`: the engine's own digits, never forced.
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decision 2, as amended 2026-10-28: the digits are a per-customer setting).
 */
import { NumberingSystem } from "#core/enums/numbering-system.enum";

/** The `nu` keyword of a tag's `-u-` extension. */
const NU = /-u(?:-[a-z0-9]{2,8})*?-nu-([a-z0-9]{3,8})(?:-|$)/i;

/**
 * The numbering system `tag` names.
 *
 * @example
 * numeralsOf("ar-SA-u-nu-arab"); // "arab"
 * numeralsOf("de-u-hc-h23-nu-latn"); // "latn"
 * numeralsOf("ar"); // "user"
 */
export function numeralsOf(tag: string): NumberingSystem {
  const system = NU.exec(tag)?.[1]?.toLowerCase();
  return system === NumberingSystem.Latn || system === NumberingSystem.Arab
    ? system
    : NumberingSystem.User;
}
