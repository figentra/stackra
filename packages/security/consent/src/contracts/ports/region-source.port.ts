/**
 * Stackra file contract:
 * Purpose: the `RegionSource` port: reads the visitor's region code (ISO 3166-1 alpha-2, such as `SA`) from an incoming
 *          request's headers, so the host can call `ConsentLedger.setRegion` and the region's `ConsentRegime` applies
 *          before the visitor decides.
 * Boundary: an abstract class that is its own token. It runs where the request is seen (the edge, a server render, an
 *           API handler), never in the browser, and only reads: it decides nothing and never calls the ledger itself.
 *           `null` means unknown, so the `default` regime applies. The package ships the Cloudflare `cf-ipcountry`
 *           driver; a host on another edge binds its own with `@Replaces(RegionSource)`.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decision 4: regional defaults); ADR 0294 (decisions 16 and 17); ADR 0263.
 */
import { Port } from "@stackra/contracts";

/**
 * Reads the visitor's region from a request.
 *
 * @example
 * ledger.setRegion(regionSource.regionOf(request.headers));
 */
export abstract class RegionSource extends Port {
  /** The region code of the request with `headers`, upper case, or `null` when it is unknown. */
  abstract regionOf(headers: Headers): string | null;
}
