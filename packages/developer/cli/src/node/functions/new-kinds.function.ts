/**
 * Stackra file contract:
 * Purpose: `newKinds(usage?)`, every kind `stackra new <kind>` takes, read from the body's own usage in the order it
 *          lists them, so `askNew` offers a kind the body learns without this file changing.
 * Boundary: pure; reads only the usage string.
 * Runtime: node
 * Governing contract: ADR 0506; STA-2883.
 */
import { NEW_COMMAND } from "#node/constants/new-command.constant";

/**
 * Every kind `stackra new <kind>` takes, in the order its usage lists them.
 *
 * @param usage - the body's usage (one `stackra new <a|b|…>` per line).
 * @example
 * newKinds("stackra new <package|service> <name>"); // ["package", "service"]
 */
export function newKinds(usage: string = NEW_COMMAND.usage): string[] {
  const kinds = [...usage.matchAll(/stackra new <([^>]+)>/g)].flatMap((match) =>
    (match[1] ?? "").split("|"),
  );
  return [...new Set(kinds)];
}
