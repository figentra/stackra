/**
 * Stackra file contract:
 * Purpose: `resolveHost`: what a request's hostname means — its `HostEntry` from the host map, or null.
 * Boundary: a lookup only; the hostname is matched lower case and without a trailing dot. An unknown host is null,
 *           never a default (ADR 0437 decision 2.1).
 * Runtime: worker
 * Governing contract: ADR 0437 (decision 2.1).
 */
import type { HostEntry } from "#src/interfaces/host-entry.interface";

/**
 * The entry of `hostname`, or null when the map has none.
 *
 * @example
 * resolveHost(settings.hosts, new URL(request.url).hostname);
 */
export function resolveHost(
  hosts: Readonly<Record<string, HostEntry>>,
  hostname: string,
): HostEntry | null {
  const key = hostname.toLowerCase().replace(/\.$/, "");
  return Object.hasOwn(hosts, key) ? (hosts[key] ?? null) : null;
}
