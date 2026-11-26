/**
 * Stackra file contract:
 * Purpose: `packageMentions`, every `@stackra/<name>` and `@stackra-pro/<name>` written in inline code on a page, with
 *          its line. An entry path is dropped (`@stackra/builder/react` is `@stackra/builder`); a scope wildcard
 *          (`@stackra/*`) is not a package and is skipped.
 * Boundary: pure: text in, mentions out. Only inline code counts, so prose and link targets never match.
 * Runtime: node
 * Governing contract: ADR 0461; STA-2865.
 */
import type { PackageMention } from "#scripts/free-and-pro/package-mention";

/** A package name in inline code: the scope, the name, then an optional entry path. */
const MENTION = /`(@stackra(?:-pro)?\/[a-z0-9][a-z0-9-]*)(?:\/[^`]*)?`/g;

/**
 * Finds the package names written in inline code on a page.
 *
 * @param text - the page text.
 * @returns one mention per occurrence, in line order.
 * @example
 * packageMentions("Use `@stackra/builder/react` or `@stackra-pro/devtools`.");
 * // [{ name: "@stackra/builder", line: 1 }, { name: "@stackra-pro/devtools", line: 1 }]
 */
export function packageMentions(text: string): PackageMention[] {
  return text
    .split("\n")
    .flatMap((current, index) =>
      [...current.matchAll(MENTION)].map((match) => ({ name: match[1] ?? "", line: index + 1 })),
    );
}
