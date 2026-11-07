/**
 * Stackra file contract:
 * Purpose: `securityHeaders`, the headers every response carries beside the policy: `Strict-Transport-Security`,
 *          `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` (every baseline feature off
 *          unless the configuration allows it), `Cross-Origin-Opener-Policy: same-origin` and `X-Frame-Options: DENY`
 *          for browsers that ignore `frame-ancestors`, on every path that allows no framer.
 * Boundary: pure: reads the configuration and the request's path and resolved framers only. On by default (owner
 *           round 3 #34): a host tunes HSTS, the referrer policy and the allowed features, and can never drop
 *           `nosniff` or the opener policy; the frame refusal goes only where `frameAncestors` allows a framer.
 *           `preload` is printed only with `includeSubDomains` and at least a year of max-age, as the preload list
 *           requires. The policy header itself is `contentSecurityPolicy`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers); ADR 0251 (desktop hardening); owner round 3 #34.
 */
import type { CspConfig } from "#config/csp.config";
import { PERMISSIONS_POLICY_BASELINE } from "#core/constants/permissions-policy-baseline.constant";
import { cspSource } from "#core/functions/csp-source.function";
import { frameAncestors } from "#core/functions/frame-ancestors.function";
import type { CspAdditions } from "#core/types/csp-additions.type";

/** The shortest max-age the HSTS preload list accepts. */
const PRELOAD_MIN_SECONDS = 31_536_000;

/** One allowance as the header prints it: `self`, or a host source in quotes. */
const allowanceOf = (source: string): string =>
  source === "self" ? "self" : `"${cspSource(source)}"`;

/**
 * The security headers of one response.
 *
 * @throws TypeError when an allowed source is not one host or scheme source, or a framer is not `self` or one origin.
 * @example
 * for (const [name, value] of Object.entries(securityHeaders(csp))) response.headers.set(name, value);
 */
export function securityHeaders(
  config: Pick<
    CspConfig,
    | "hstsMaxAgeSeconds"
    | "hstsIncludeSubDomains"
    | "hstsPreload"
    | "referrerPolicy"
    | "permissionsAllow"
    | "frameAncestors"
  >,
  additions: Pick<CspAdditions, "path" | "frameAncestors"> = {},
): Readonly<Record<string, string>> {
  const hsts = [`max-age=${config.hstsMaxAgeSeconds}`];
  if (config.hstsIncludeSubDomains) hsts.push("includeSubDomains");
  if (
    config.hstsPreload &&
    config.hstsIncludeSubDomains &&
    config.hstsMaxAgeSeconds >= PRELOAD_MIN_SECONDS
  )
    hsts.push("preload");
  const permissions = PERMISSIONS_POLICY_BASELINE.map((feature) => {
    const allowed: readonly string[] = config.permissionsAllow[feature] ?? [];
    return `${feature}=(${[...new Set(allowed)].map(allowanceOf).join(" ")})`;
  });
  const headers: Record<string, string> = {
    "Strict-Transport-Security": hsts.join("; "),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": config.referrerPolicy,
    "Permissions-Policy": permissions.join(", "),
    "Cross-Origin-Opener-Policy": "same-origin",
  };
  // X-Frame-Options cannot name a framer, so a path that allows one leaves framing to frame-ancestors
  if (frameAncestors(config, additions)[0] === "'none'") headers["X-Frame-Options"] = "DENY";
  return Object.freeze(headers);
}
