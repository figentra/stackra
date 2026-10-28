/**
 * Stackra file contract:
 * Purpose: `CfIpcountryRegionSourceDriver`, the `cf-ipcountry` driver of the `RegionSource` port: the visitor's
 *          region is the two-letter country Cloudflare puts in the `cf-ipcountry` request header.
 * Boundary: reads one header and validates it as two letters; Cloudflare's `XX` (no country) and `T1` (Tor) and any
 *           other value read as unknown (`null`), so the `default` regime applies. Trusts the header only as far as the
 *           host's edge does: behind Cloudflare the client cannot set it. Stateless.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decision 4); ADR 0263 (a driver is named by its class: `cf-ipcountry`).
 */
import { Driver } from "@stackra/container";

import { RegionSource } from "#contracts/ports/region-source.port";

/** Two letters; Cloudflare's codes are ISO 3166-1 alpha-2. */
const COUNTRY = /^[A-Z]{2}$/;

/** Codes Cloudflare sends that are not a country. */
const UNKNOWN = new Set(["XX", "T1"]);

/**
 * Reads the region from Cloudflare's `cf-ipcountry` header.
 *
 * @example
 * new CfIpcountryRegionSourceDriver().regionOf(new Headers({ "cf-ipcountry": "sa" })); // "SA"
 */
export class CfIpcountryRegionSourceDriver extends Driver(RegionSource) {
  /** The upper-cased `cf-ipcountry` value, or `null` when it is missing, malformed, `XX` or `T1`. */
  regionOf(headers: Headers): string | null {
    const code = headers.get("cf-ipcountry")?.trim().toUpperCase() ?? "";
    return COUNTRY.test(code) && !UNKNOWN.has(code) ? code : null;
  }
}
