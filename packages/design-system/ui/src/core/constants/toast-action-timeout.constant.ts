/**
 * Stackra file contract:
 * Purpose: how long, in milliseconds, a toast that carries an action stays when the caller sets no timeout: twice the
 *          4000 ms of a plain toast, so a user can still reach the action (WCAG 2.2 SC 2.2.1).
 * Boundary: data only; the web and native `toast()` read it. Web HeroUI also pauses the timer on hover and focus,
 *           native has no pause, which is why the default is longer rather than relying on it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decisions 1 to 3); WCAG 2.2 SC 2.2.1.
 */

/** The default timeout, in milliseconds, of a toast with an action; a caller's own `timeout` always wins. */
export const TOAST_ACTION_TIMEOUT = 8000;
