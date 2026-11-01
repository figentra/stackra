/**
 * Stackra file contract:
 * Purpose: `resolveHost(name, zone)`, the DNS name a surface or app-link host resolves to in an environment: relative to
 *          the environment's `domains.zone` (`console.mezzora` → `console.mezzora.figentra.com`, D9) unless it already
 *          ends in that zone or ends in `.` (a product's own domain, `mezzora.com.`).
 * Boundary: pure; `undefined` when a relative name has no zone or the result is not a lower-case DNS name of two labels
 *           or more. Shared by `platformRows` and `checkHosts` (STA-1796), so both read a host the same way.
 * Runtime: isomorphic
 * Governing contract: owner decision D9 (host pattern); ADR 0437 (the KV copy).
 */

/** A lower-case DNS name of two labels or more. */
const HOSTNAME =
  /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

/**
 * The host `name` resolves to under `zone`, or `undefined` when it cannot.
 *
 * @example
 * resolveHost("console.mezzora", "figentra.com"); // "console.mezzora.figentra.com"
 * resolveHost("mezzora.com.", undefined); // "mezzora.com"
 */
export function resolveHost(name: string, zone: string | undefined): string | undefined {
  const host = name.endsWith(".")
    ? name.slice(0, -1)
    : zone === undefined
      ? undefined
      : name === zone || name.endsWith(`.${zone}`)
        ? name
        : `${name}.${zone}`;
  return host !== undefined && HOSTNAME.test(host) ? host : undefined;
}
