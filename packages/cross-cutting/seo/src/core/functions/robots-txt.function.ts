/**
 * Stackra file contract:
 * Purpose: `robotsTxt`, the text of `robots.txt`: one block per crawler group (`User-agent`, then its `Allow` and
 *          `Disallow` lines), blocks separated by a blank line, then the sitemap links.
 * Boundary: a pure function. Each group is its own block, so a rule written for one crawler never applies to another;
 *           a group with no rules writes an empty `Disallow:`, which allows everything, so the block stays valid. A
 *           value with a line break would add a directive, so it is refused. Which groups a site gets (the config's,
 *           or disallow-all on a preview host) is the caller's choice.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decision 3); RFC 9309.
 */
import type { RobotsGroup } from "#core/types/robots-group.type";

/**
 * `value` as one directive value.
 *
 * @throws TypeError when `value` holds a line break.
 */
function oneLine(value: string): string {
  if (/[\r\n]/.test(value)) throw new TypeError("A robots.txt value holds a line break");
  return value.trim();
}

/**
 * The text of `robots.txt`.
 *
 * @example
 * robotsTxt({ groups: [{ userAgent: "*", allow: ["/"], disallow: ["/store?q="] }], sitemap: `${origin}/sitemap.xml` });
 * @param input.groups - one group per crawler; a crawler named twice keeps both blocks, as RFC 9309 merges them.
 * @param input.sitemap - the absolute URL of the sitemap index, or several.
 * @throws TypeError when a value holds a line break, or a group has no user agent.
 */
export function robotsTxt(input: {
  readonly groups: readonly RobotsGroup[];
  readonly sitemap?: string | readonly string[] | undefined;
}): string {
  const blocks = input.groups.map((group) => {
    const userAgent = oneLine(group.userAgent);
    if (userAgent === "") throw new TypeError("A robots.txt group has no user agent");
    const lines = [`User-agent: ${userAgent}`];
    for (const path of group.allow) lines.push(`Allow: ${oneLine(path)}`);
    for (const path of group.disallow) lines.push(`Disallow: ${oneLine(path)}`);
    if (lines.length === 1) lines.push("Disallow:");
    return lines.join("\n");
  });
  const sitemaps = input.sitemap === undefined ? [] : [input.sitemap].flat();
  if (sitemaps.length > 0)
    blocks.push(sitemaps.map((url) => `Sitemap: ${oneLine(url)}`).join("\n"));
  return `${blocks.join("\n\n")}\n`;
}
