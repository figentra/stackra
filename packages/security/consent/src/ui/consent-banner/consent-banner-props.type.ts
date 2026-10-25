/**
 * Stackra file contract:
 * Purpose: `ConsentBannerProps`, what a host passes the cookie banner: where the cookie policy lives and what
 *          "Manage" opens.
 * Boundary: a type only. The categories come from `ConsentConfig`; the texts from `assets/lang`; the policy's text from
 *           the OS compliance service, behind `policyHref`.
 * Runtime: isomorphic
 * Governing contract: owner round 3 #29 (cookie banner); ADR 0298; ADR 0294 (decision 8).
 */

/** Props of `ConsentBanner`. */
export interface ConsentBannerProps {
  /** The cookie policy page; the banner links it when given. */
  readonly policyHref?: string;

  /** Opens the preferences (a drawer or a page with `ConsentPreferences`); the button shows only when given. */
  readonly onManage?: () => void;
}
