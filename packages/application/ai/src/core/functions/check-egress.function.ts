/**
 * Stackra file contract:
 * Purpose: `checkEgress`, whether a page reader may fetch a URL: https on the default port, no credentials in the URL,
 *          a public host name (never an IP literal, `localhost`, a single label, or a `.local`, `.internal`,
 *          `.localhost` or `.home.arpa` name), not denied by the policy, and allowed by it when it lists hosts.
 * Boundary: pure; checks the URL text only. It cannot see what a public name resolves to, so a name pointing at a
 *           private address passes here: the service runs the HTTP driver on a network path that cannot reach
 *           private addresses (ADR 0450 decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0450 (decision 3); ADR 0308 (rule 19); STA-904 (page reader).
 */
import { PageReadRefusal } from "#contracts/enums/page-read-refusal.enum";

import type { PageReaderPolicy } from "#core/types/page-reader-policy.type";

/** Names that only resolve inside a network. */
const PRIVATE_SUFFIXES = [".local", ".internal", ".localhost", ".home.arpa"] as const;

/** True when `host` matches `pattern` (`example.com` exactly, `*.example.com` any subdomain). */
function matches(host: string, pattern: string): boolean {
  const lower = pattern.toLowerCase();
  return lower.startsWith("*.") ? host.endsWith(lower.slice(1)) : host === lower;
}

/**
 * `undefined` when `url` may be fetched under `policy`, else `PageReadRefusal.EgressRefused`.
 *
 * @example
 * checkEgress("https://shop.example.com/a", policy); // undefined
 * checkEgress("http://169.254.169.254/latest", policy); // "egress_refused"
 */
export function checkEgress(
  url: string,
  policy: Pick<PageReaderPolicy, "allowHosts" | "denyHosts">,
): PageReadRefusal | undefined {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return PageReadRefusal.EgressRefused;
  }
  // WHATWG URL already lower-cases the host and normalises numeric hosts (`2130706433`) to dotted IPv4.
  const host = parsed.hostname.replace(/\.$/, "");
  const refused =
    parsed.protocol !== "https:" ||
    parsed.port !== "" ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    host.startsWith("[") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
    !host.includes(".") ||
    PRIVATE_SUFFIXES.some((suffix) => host.endsWith(suffix)) ||
    (policy.denyHosts ?? []).some((pattern) => matches(host, pattern)) ||
    (policy.allowHosts !== undefined &&
      !policy.allowHosts.some((pattern) => matches(host, pattern)));
  return refused ? PageReadRefusal.EgressRefused : undefined;
}
