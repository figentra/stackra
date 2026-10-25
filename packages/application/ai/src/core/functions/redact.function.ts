/**
 * Stackra file contract:
 * Purpose: `redact(text, rules)`, `text` with every match of each rule replaced, in rule order, before it reaches a
 *          model.
 * Boundary: pure. Every rule matches globally; an invalid pattern or flag throws, so a broken pack never lets text
 *           through unredacted.
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decision 15); OS-315.
 */
import type { RedactionRule } from "#core/types/redaction-rule.type";

/**
 * The redacted text.
 *
 * @throws SyntaxError when a rule's pattern or flags are not a valid regular expression.
 * @example
 * redact("mail a@b.co", [{ name: "email", pattern: "[^\\s@]+@[^\\s@]+" }]); // "mail [email]"
 */
export function redact(text: string, rules: readonly RedactionRule[]): string {
  return rules.reduce((current, rule) => {
    const flags = new Set(["g", ...(rule.flags ?? "")]);
    return current.replace(
      new RegExp(rule.pattern, [...flags].join("")),
      () => rule.replacement ?? `[${rule.name}]`,
    );
  }, text);
}
