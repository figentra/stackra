/**
 * Stackra file contract:
 * Purpose: `addTags(tags, incoming, rules)`, the tags after adding `incoming` to `tags`: each new tag is checked
 *          in order (the caller's `validate`, duplicates ignoring case, then the maximum) and the refused ones are
 *          handed back with the reason.
 * Boundary: pure; the order of the tags is kept.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave A, owner request 2026-10-29).
 */
import type { TagRejection } from "#core/types/tag-rejection.type";

/**
 * Adds the tags that pass.
 * @param tags - the tags already there
 * @param incoming - the tags to add, in order
 * @param rules - the maximum, whether duplicates are allowed, and a check that returns a message for a bad tag
 */
export function addTags(
  tags: readonly string[],
  incoming: readonly string[],
  rules: {
    readonly max?: number | undefined;
    readonly allowDuplicates?: boolean | undefined;
    readonly validate?: ((tag: string) => string | undefined) | undefined;
  } = {},
): { readonly tags: readonly string[]; readonly rejected: readonly TagRejection[] } {
  const next = [...tags];
  const rejected: TagRejection[] = [];
  for (const tag of incoming) {
    const message = rules.validate?.(tag);
    if (message) rejected.push({ tag, reason: "invalid", message });
    else if (
      !rules.allowDuplicates &&
      next.some((other) => other.toLocaleLowerCase() === tag.toLocaleLowerCase())
    )
      rejected.push({ tag, reason: "duplicate" });
    else if (rules.max !== undefined && next.length >= rules.max)
      rejected.push({ tag, reason: "max" });
    else next.push(tag);
  }
  return { tags: next, rejected };
}
