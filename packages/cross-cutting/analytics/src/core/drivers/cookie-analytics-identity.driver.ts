/**
 * Stackra file contract:
 * Purpose: the `cookie` driver of the `AnalyticsIdentity` port, the web's store: the identity is one first-party cookie
 *          (`AnalyticsConfig.identityCookieName`), JSON URI-encoded, path `/`, `SameSite=Lax`, `Secure` on HTTPS,
 *          kept `identityExpiryDays` days.
 * Boundary: browser only, through `document.cookie`, and written only after consent (the client's rule). Outside a
 *           browser `read` answers `null` and a write or a clear does nothing: a server render has no visitor, and an
 *           identity lost there costs one visitor, never a crash. An unreadable cookie reads as no identity.
 * Runtime: browser
 * Governing contract: ADR 0298 (decisions 1 and 5); ADR 0071; ADR 0294 (decision 17: drivers).
 */
import { Driver } from "@stackra/container";

import type { AnalyticsConfig } from "#config/analytics.config";
import { AnalyticsIdentity } from "#contracts/ports/analytics-identity.port";
import type { AnalyticsIdentityRecord } from "#contracts/types/analytics-identity-record.type";
import { parseAnalyticsIdentity } from "#core/functions/parse-analytics-identity.function";

/** Seconds in a day, for `Max-Age`. */
const DAY_SECONDS = 86_400;

/**
 * Keeps the identity in a first-party cookie.
 *
 * @example
 * const identity = new CookieAnalyticsIdentityDriver(buildConfig(AnalyticsConfig));
 * identity.read(); // the visitor's identity, or null
 */
export class CookieAnalyticsIdentityDriver extends Driver(AnalyticsIdentity) {
  private readonly config: AnalyticsConfig;

  /**
   * @param config - the cookie's name and lifetime.
   */
  constructor(config: AnalyticsConfig) {
    super();
    this.config = config;
  }

  /** The identity in the cookie, or `null` outside a browser or when the cookie is absent or unreadable. */
  read(): AnalyticsIdentityRecord | null {
    if (typeof document === "undefined") return null;
    const prefix = `${this.config.identityCookieName}=`;
    const pair = document.cookie.split(/;\s*/).find((part) => part.startsWith(prefix));
    if (pair === undefined) return null;
    try {
      return parseAnalyticsIdentity(decodeURIComponent(pair.slice(prefix.length)));
    } catch {
      return null;
    }
  }

  /** Sets the cookie to `record` for `identityExpiryDays` days. */
  write(record: AnalyticsIdentityRecord): void {
    this.set(
      encodeURIComponent(JSON.stringify(record)),
      this.config.identityExpiryDays * DAY_SECONDS,
    );
  }

  /** Expires the cookie. */
  clear(): void {
    this.set("", 0);
  }

  /** Writes the cookie with its fixed attributes; nothing outside a browser. */
  private set(value: string, maxAge: number): void {
    if (typeof document === "undefined") return;
    const secure = globalThis.location?.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${this.config.identityCookieName}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  }
}
