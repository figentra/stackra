/**
 * Stackra file contract:
 * Purpose: `resourceName(parts, limit)`, the AWS name of one runtime resource: each part lower-cased with every run of
 *          other characters turned into one hyphen (`loyalty_kit` → `loyalty-kit`), joined by hyphens, and cut to the
 *          resource kind's length limit with a stable hash of the whole name, so two long names stay apart.
 * Boundary: internal; pure and isomorphic. The result holds only lower-case letters, digits and single hyphens and
 *           starts with the project's letter, which S3 buckets, SQS queues, SNS topics and ElastiCache ids all accept.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (resource keys come from runway), ADR 0231 (names).
 */

/** The hash suffix and its hyphen. */
const SUFFIX_LENGTH = 8;

/** FNV-1a (32 bit) of `text`, seven base-36 characters. */
function hashOf(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    // oxlint-disable-next-line unicorn/prefer-code-point -- hashes UTF-16 code units; code points would change every hash already issued
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(SUFFIX_LENGTH - 1, "0");
}

/**
 * The name made of `parts`, at most `limit` characters.
 *
 * @param parts - project, environment, member and resource key, in that order.
 * @param limit - the resource kind's longest name (S3 63, SQS 80, ElastiCache 40).
 * @example
 * resourceName(["acme-platform", "staging", "loyalty_kit", "default"], 80); // "acme-platform-staging-loyalty-kit-default"
 */
export function resourceName(parts: readonly string[], limit: number): string {
  const name = parts
    .map((part) =>
      part
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .filter((part) => part !== "")
    .join("-");
  if (name.length <= limit) return name;
  return `${name.slice(0, limit - SUFFIX_LENGTH).replace(/-+$/, "")}-${hashOf(name)}`;
}
