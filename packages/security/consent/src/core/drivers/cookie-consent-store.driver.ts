/**
 * Stackra file contract:
 * Purpose: the cookie driver of the `ConsentStore` port, the web's store: the decision is the one cookie a page sets
 *          before a decision (`ConsentConfig.cookieName`), JSON URI-encoded, path `/`, `SameSite=Lax`, `Secure` on
 *          HTTPS, kept `expiryDays` days.
 * Boundary: browser only, through `document.cookie`: consent state lives only in the client and no HTML GET response
 *           sets this cookie. Outside a browser `read` answers `null` (a server render has no decision) and a write or
 *           a clear throws, because a decision written nowhere would be lost silently. An unreadable cookie reads as
 *           no decision.
 * Runtime: browser
 * Governing contract: ADR 0298 (decisions 1, 3 and 6); ADR 0294 (decision 17: drivers).
 */
import { Driver } from "@stackra/container";

import { ConsentConfig } from "#config/consent.config";
import { ConsentStore } from "#contracts/ports/consent-store.port";
import type { ConsentRecord } from "#contracts/types/consent-record.type";
import { parseConsentRecord } from "#core/functions/parse-consent-record.function";

/** Seconds in a day, for `Max-Age`. */
const DAY_SECONDS = 86_400;

/**
 * Keeps the decision in a first-party cookie.
 *
 * @example
 * const store = new CookieConsentStoreDriver(buildConfig(ConsentConfig));
 * store.read(); // the visitor's decision, or null
 */
export class CookieConsentStoreDriver extends Driver(ConsentStore) {
  private readonly config: ConsentConfig;

  /** @param config - the cookie's name and lifetime. */
  constructor(config: ConsentConfig) {
    super();
    this.config = config;
  }

  /** The decision in the cookie, or `null` outside a browser or when the cookie is absent or unreadable. */
  read(): ConsentRecord | null {
    if (typeof document === "undefined") return null;
    const prefix = `${this.config.cookieName}=`;
    const pair = document.cookie.split(/;\s*/).find((part) => part.startsWith(prefix));
    if (pair === undefined) return null;
    try {
      return parseConsentRecord(decodeURIComponent(pair.slice(prefix.length)));
    } catch {
      return null;
    }
  }

  /**
   * Sets the cookie to `record` for `expiryDays` days.
   *
   * @throws Error outside a browser.
   */
  write(record: ConsentRecord): void {
    this.set(encodeURIComponent(JSON.stringify(record)), this.config.expiryDays * DAY_SECONDS);
  }

  /**
   * Expires the cookie.
   *
   * @throws Error outside a browser.
   */
  clear(): void {
    this.set("", 0);
  }

  /** Writes the cookie with its fixed attributes. */
  private set(value: string, maxAge: number): void {
    if (typeof document === "undefined")
      throw new Error("CookieConsentStoreDriver writes the consent cookie in a browser only");
    const secure = globalThis.location?.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${this.config.cookieName}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  }
}
