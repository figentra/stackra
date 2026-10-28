/**
 * Stackra file contract:
 * Purpose: `apiCacheControl`, ADR 0325 rule 22 for one API answer: `private, no-store` when the request is signed in
 *          (it carries an `Authorization` header or any cookie) or the answer sets a cookie; otherwise `undefined`,
 *          which leaves the handler's own header.
 * Boundary: pure; it answers the header value, never a `Response`, so the generated adapter (`answerHttp`) sets it on
 *           every answer and it overrides what a handler set: the rule is not a per-app option. Static assets and HTML
 *           never pass through it (rules 20 and 21 are the web runtime's).
 * Runtime: node
 * Governing contract: ADR 0325 (rule 22); ADR 0237 (the gateway applies it, as amended by 0325); STA-1448.
 */

/**
 * The `Cache-Control` value rule 22 forces on the answer to `request`, or `undefined` when it forces none.
 *
 * @example
 * const forced = apiCacheControl(request, response);
 * if (forced !== undefined) response.headers.set("cache-control", forced);
 */
export function apiCacheControl(request: Request, response: Response): string | undefined {
  // shortcut: any cookie counts as signed in (no session cookie name is known here), so an anonymous request that
  // carries a consent cookie is not cacheable either; narrow it with rule 23's cache profiles (stackra-299).
  const signedIn = request.headers.has("authorization") || request.headers.has("cookie");
  return signedIn || response.headers.has("set-cookie") ? "private, no-store" : undefined;
}
