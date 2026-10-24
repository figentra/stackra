/**
 * Stackra file contract:
 * Purpose: `updateFeed(member)`, the desktop update feed of a member in the environment its bundle was built for:
 *          `<root targets.electron-release.feed.publicOrigin>/<release.desktop.feedPath>/<environments.<env>.desktop.channel>/`,
 *          or `null` where the environment has no desktop channel (dev).
 * Boundary: reads the facts only; `definesFor` resolves the three parts at build time and injects them, so a packaged
 *           app reads no file. The URL is never a var in a member runway.
 * Runtime: isomorphic
 * Governing contract: ADR 0254 (desktop release and the feed), ADR 0296 (decision 1).
 */
import type { Url } from "@stackra/contracts";

import { memberFacts } from "#core/functions/member-facts.function";

/**
 * The member's update feed, or `null` when it has none here.
 *
 * @param member - the member key (`console`).
 * @throws RunwayUnresolvedError when there are no facts or the member is absent.
 * @example
 * updateFeed("console"); // "https://downloads.acme.example/console/latest/" in a production build
 */
export function updateFeed(member: string): Url | null {
  const { facts, member: entry } = memberFacts(member);
  if (facts.feedOrigin === undefined || entry.feed === undefined) return null;
  return `${facts.feedOrigin.replace(/\/+$/, "")}/${entry.feed.path}/${entry.feed.channel}/` as Url;
}
