/**
 * Stackra file contract:
 * Purpose: `sentryTarget(dsn)`, the envelope endpoint and public key of a Sentry DSN
 *          (`https://<key>@<host>[/<path>]/<project>`), or `undefined` for anything else.
 * Boundary: pure; never throws, so a malformed secret turns reporting off instead of failing a caller. Only `https`
 *           and `http` DSNs are accepted.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 6); the Sentry envelope protocol.
 */
import type { SentryTarget } from "#core/types/sentry-target.type";

/**
 * Parses a DSN.
 *
 * @example
 * sentryTarget("https://abc@o1.ingest.sentry.io/42")?.endpoint; // "https://o1.ingest.sentry.io/api/42/envelope/"
 */
export function sentryTarget(dsn: string): SentryTarget | undefined {
  let url: URL;
  try {
    url = new URL(dsn);
  } catch {
    return undefined;
  }
  const segments = url.pathname.split("/").filter((segment) => segment !== "");
  const project = segments.pop();
  if (
    (url.protocol !== "https:" && url.protocol !== "http:") ||
    url.username === "" ||
    project === undefined ||
    !/^\d+$/.test(project)
  )
    return undefined;
  const prefix = segments.length === 0 ? "" : `/${segments.join("/")}`;
  return {
    endpoint: `${url.protocol}//${url.host}${prefix}/api/${project}/envelope/`,
    key: decodeURIComponent(url.username),
    dsn,
  };
}
