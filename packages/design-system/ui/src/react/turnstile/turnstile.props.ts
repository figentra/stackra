/**
 * Stackra file contract:
 * Purpose: `TurnstileProps`, the props of the web `Turnstile` in `turnstile.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0165 (decision 2: form adapters in
 *          @stackra/ui); owner decision 12 of 2026-10-25 (Turnstile in `./react`); ADR 0302 (decision 3).
 */
/** Props of the web Turnstile. */
export interface TurnstileProps {
  /** The name the token is posted under; Cloudflare's own `cf-turnstile-response` when left out. */
  readonly name?: string | undefined;
  /** The site key; the app's `VITE_TURNSTILE_SITE_KEY` when left out. */
  readonly siteKey?: string | undefined;
  /**
   * Called with Cloudflare's error code when the challenge fails (a refused visitor, a network error); the form then
   * has no token, so the server refuses the post.
   */
  readonly onError?: ((code: string) => void) | undefined;
}
