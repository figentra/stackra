/**
 * Stackra file contract:
 * Purpose: `PageReadRefusal`, why a `PageReader` read no page: the URL is outside the egress bound, the site answered
 *          with an error, the page is not HTML or is too large, it took too long, it redirected too often, or nothing
 *          answered.
 * Boundary: an enum (`Enum.of`), snake_case codes (ADR 0231). A refusal carries no response body, header or credential,
 *           so it is safe to show to the merchant and to hand to a model.
 * Runtime: isomorphic
 * Governing contract: ADR 0450 (decisions 1 and 3); STA-904 (page reader).
 */
import { Enum } from "@stackra/contracts";

/**
 * Why a page was not read.
 *
 * @example
 * if (!result.ok && result.refusal === PageReadRefusal.EgressRefused) askForAnotherUrl();
 */
export const PageReadRefusal = Enum.of({
  /** The URL, or a redirect it led to, is outside the egress bound (not https, a private host, a denied host). */
  EgressRefused: "egress_refused",
  /** The site answered with a status outside 2xx, or a redirect without a target. */
  HttpError: "http_error",
  /** The response is not an HTML document. */
  NotHtml: "not_html",
  /** The response is larger than the policy's byte limit. */
  TooLarge: "too_large",
  /** The site did not answer within the policy's time limit. */
  Timeout: "timeout",
  /** The site redirected more often than the policy allows. */
  TooManyRedirects: "too_many_redirects",
  /** Nothing answered: the host does not resolve, the connection failed, or the memory driver holds no such page. */
  Unreachable: "unreachable",
});

/** One of the codes above. */
export type PageReadRefusal = Enum.Value<typeof PageReadRefusal>;
