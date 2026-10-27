/**
 * Stackra file contract:
 * Purpose: `TransportRequest`, one call a driver asks the host to make to an authority, an ASP or an access point.
 * Boundary: a type only. The URL comes from pack options. `credential` names the unit whose credential the host's
 *           binding attaches (a CSID, a client token, an API key); the package never sees it.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4).
 */

/** An outbound HTTP call. */
export type TransportRequest = {
  /** The HTTP method of the request. */
  readonly method: "GET" | "POST";
  /** Absolute URL from the pack. */
  readonly url: string;
  /** The unit whose credential authenticates the call; `null` for an unauthenticated call. */
  readonly credential: string | null;
  /** Request headers other than authentication. */
  readonly headers: Readonly<Record<string, string>>;
  /** Request body as text; `null` for none. */
  readonly body: string | null;
};
