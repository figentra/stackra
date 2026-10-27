/**
 * Stackra file contract:
 * Purpose: `PageReaderPolicy`, the egress bound and limits of `HttpPageReaderDriver`: which hosts it may reach, how many
 *          bytes, how long, how many redirects, how much text it keeps, and the user agent it sends.
 * Boundary: a type only. Configuration, not code: the service reads it from settings (platform floor, product,
 *           scope) and passes it to the driver; this package holds no default. https, a public host name and the
 *           default port are always required on top of it (`checkEgress`); the policy can only narrow that.
 * Runtime: isomorphic
 * Governing contract: ADR 0450 (decision 3); ADR 0308 (rule 19: egress is an allow-list); STA-904 (page reader).
 */

/** The egress bound and limits of one page reader. */
export interface PageReaderPolicy {
  /**
   * Hosts the reader may reach: `shop.example.com` exactly, or `*.example.com` for its subdomains. Absent means any
   * public host, the store-from-a-URL case, where the merchant names the host.
   */
  readonly allowHosts?: readonly string[];

  /** Hosts the reader never reaches, in the same forms; checked before `allowHosts`. */
  readonly denyHosts?: readonly string[];

  /** The largest response body read, in bytes. */
  readonly maxBytes: number;

  /** The time limit of each request, body included, in milliseconds. */
  readonly timeoutMs: number;

  /** How many redirects are followed; each target is checked against the bound again. */
  readonly maxRedirects: number;

  /** The readable text kept per page, in characters; the rest is cut and `truncated` set. */
  readonly maxTextChars: number;

  /** The `user-agent` header sent, naming the product's crawler. */
  readonly userAgent: string;
}
