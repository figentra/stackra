/**
 * Stackra file contract:
 * Purpose: `AnalyticsContext`, where an analytics event was captured: the library that sent it, the page path or the
 *          screen name, the locale, the app version and the visitor's region, so a destination can segment without
 *          asking the event class to repeat them.
 * Boundary: a type only, carried by every `AnalyticsDelivery`. Every field but `library` is optional: a driver never
 *           assumes one is set. A page carries its path only (no query string, no title, no referrer), so nothing a
 *           URL may hold leaves the device here. `device` is coarse and declared (ADR 0483 decision 6): the OS, its
 *           version, the build and the device type, never a model, a hardware id or an advertising id.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 1 and 5); ADR 0483 (decision 6); ADR 0305 (rule 20); ADR 0294 (decision 15).
 */

/** Where an event was captured. */
export interface AnalyticsContext {
  /** The library that sent the event, such as `@stackra/analytics`; `version` when the host knows it. */
  readonly library: { readonly name: string; readonly version?: string };

  /** The web page, by path only, such as `/pricing`. */
  readonly page?: { readonly path: string };

  /** The native screen, by its route name, such as `checkout`. */
  readonly screen?: { readonly name: string };

  /** The visitor's BCP 47 locale, such as `ar-SA`. */
  readonly locale?: string;

  /** The host app's version, such as `1.4.0`. */
  readonly appVersion?: string;

  /** The device, coarsely: `os` (`ios`, `android`, `web`...), its version, the app build and the device type. */
  readonly device?: {
    readonly os: string;
    readonly osVersion?: string;
    readonly build?: string;
    readonly type?: string;
  };

  /** The visitor's region code, as `ConsentLedger.setRegion` received it, such as `SA`. */
  readonly region?: string;
}
