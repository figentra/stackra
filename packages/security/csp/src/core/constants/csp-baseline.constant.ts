/**
 * Stackra file contract:
 * Purpose: `CSP_BASELINE`, the package's fixed policy, directive by directive, in the order the header prints them:
 *          same-origin by default; scripts and `<style>` elements from the origin or carrying the request's nonce;
 *          images also from `data:` and `blob:`; no plugins, no `<base>`, forms post to the origin only, and no page
 *          may frame the app.
 * Boundary: a host never edits it. `contentSecurityPolicy` adds the nonce and the configured sources to the source
 *           lists of `script-src`, `style-src`, `connect-src`, `frame-src` and `img-src` only; every other directive
 *           is fixed. `style-src-attr 'unsafe-inline'` allows inline `style` attributes only, which server-rendered
 *           React markup carries; it never allows a `<style>` element or a script. Internal: not exported.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers); ADR 0251 (desktop hardening).
 */

/** The baseline source list of each directive. */
export const CSP_BASELINE = {
  "default-src": ["'self'"],
  "script-src": ["'self'"],
  "style-src": ["'self'"],
  "style-src-attr": ["'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:"],
  "font-src": ["'self'"],
  "connect-src": ["'self'"],
  "frame-src": ["'self'"],
  "object-src": ["'none'"],
  "base-uri": ["'none'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
} as const satisfies Readonly<Record<string, readonly string[]>>;
