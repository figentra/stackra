/**
 * Stackra file contract:
 * Purpose: `heartbeatUrls`, the reader of the `STACKRA_HEARTBEAT_URLS` secret: a JSON object of kebab-case job names
 *          (as `@stackra/infra-observability` plans them) to `https://` URLs, read into a map by job name.
 * Boundary: pure; the one reader of the secret's shape, for the shipped schema's check and `HeartbeatService`. It
 *           answers `undefined` for a malformed value and never echoes it: the URLs are credentials.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 4); ADR 0173 (no secret values in config).
 */

/** A job name, as `@stackra/infra-observability` plans it: kebab-case. */
const JOB_NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/**
 * The heartbeat URLs of `text`, by job name: an empty map for an empty string, `undefined` when `text` is not a JSON
 * object of kebab-case job names to `https://` URLs.
 *
 * @example
 * heartbeatUrls('{"outbox-relay":"https://uptime.betterstack.com/api/v1/heartbeat/abc"}')?.get("outbox-relay");
 */
export function heartbeatUrls(text: string): ReadonlyMap<string, string> | undefined {
  if (text === "") return new Map();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return undefined;
  const urls = new Map<string, string>();
  for (const [name, url] of Object.entries(parsed)) {
    if (!JOB_NAME.test(name) || typeof url !== "string" || !URL.canParse(url)) return undefined;
    if (new URL(url).protocol !== "https:") return undefined;
    urls.set(name, url);
  }
  return urls;
}
