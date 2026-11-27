/**
 * Stackra file contract:
 * Purpose: `narrowHtmlPolicy`, a host policy intersected with a base (`RICH_TEXT_HTML_POLICY` by default): a tag is
 *          allowed only when both allow it, with only the attributes both allow; content is dropped wherever either
 *          drops it. The result can only keep less than the base, never more.
 * Boundary: pure; reads own keys only, so a tag name never reaches `Object.prototype`. Returns a new frozen policy and
 *           leaves both inputs untouched. A caller that takes a policy from a host (`useMail().richText` in
 *           `@stackra/notifications`) passes it through here before `sanitizeHtml`, so the host cannot widen what tenant
 *           HTML keeps (an `img` with a tracking `src`, a link `target`).
 * Runtime: isomorphic
 * Governing contract: OWASP XSS prevention (allowlist sanitization); STA-2562 frontend audit item (b); STA-2582.
 */
import { RICH_TEXT_HTML_POLICY } from "#core/constants/rich-text-html-policy.constant";
import type { HtmlPolicy } from "#core/types/html-policy.type";

/**
 * `policy` held inside `base`.
 *
 * @example
 * narrowHtmlPolicy({ tags: { p: ["dir"], img: ["src"], a: ["href", "target"] }, dropWithContent: [] });
 * // { tags: { p: ["dir"], a: ["href"] }, dropWithContent: [...RICH_TEXT_HTML_POLICY.dropWithContent] }
 */
export function narrowHtmlPolicy(
  policy: HtmlPolicy,
  base: HtmlPolicy = RICH_TEXT_HTML_POLICY,
): HtmlPolicy {
  const tags: Record<string, readonly string[]> = {};
  for (const [tag, attributes] of Object.entries(policy.tags)) {
    if (!Object.hasOwn(base.tags, tag)) continue;
    const allowed = base.tags[tag] ?? [];
    tags[tag] = Object.freeze([...new Set(attributes.filter((name) => allowed.includes(name)))]);
  }
  return Object.freeze({
    tags: Object.freeze(tags),
    dropWithContent: Object.freeze([
      ...new Set([...base.dropWithContent, ...policy.dropWithContent]),
    ]),
  });
}
