/**
 * Stackra file contract:
 * Purpose: `BFF_CONFIG_SCHEMA`, the zod schema this package ships for `BffConfig` (exported as `BffConfig$`): the
 *          BFF's client secret and cookie key (secrets, by name), the session cookie's name, the callback URL
 *          registered at the provider, the app origins a sign-in may return to, where the browser goes after
 *          sign-out, and how long a session and a sign-in attempt last.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; an unset URL, origin list or key means the BFF refuses to serve. The cookie name keeps
 *           the `__Host-` prefix (Secure, `Path=/`, no `Domain`). An origin is a scheme and host, optionally
 *           `*.`-wildcarded, never a path; the first is the default and is exact. The defaults equal `BffOptions`'
 *           initializers.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0173 and ADR 0257 (secrets are names); ADR 0206 (decision 8);
 *                     STA-1566.
 */
import { url } from "@stackra/validation";
import { z } from "zod";

/** A `__Host-` cookie name (RFC 6265bis section 4.1.3.2). */
const COOKIE_NAME = /^__Host-[A-Za-z0-9_-]+$/;

/** An origin a sign-in may return to: `https://console.acme.example` or `https://*.acme.example`. */
const ORIGIN = /^https?:\/\/(\*\.)?[^/\s*?#]+$/;

/** The shipped `BffConfig$`. */
export const BFF_CONFIG_SCHEMA = z.object({
  clientSecret: z.string().default(""),
  cookieKey: z.string().default(""),
  cookieName: z.string().regex(COOKIE_NAME).default("__Host-stackra_session"),
  redirectUri: z.union([url(), z.literal("")]).default(""),
  returnOrigins: z
    .array(z.string().regex(ORIGIN))
    .refine((origins) => origins[0]?.includes("*") !== true, {
      message: "The first return origin is exact: it is the default",
    })
    .default(() => []),
  postLogoutUri: z.union([url(), z.literal("")]).default(""),
  sessionMinutes: z.number().int().min(5).max(43_200).default(480),
  flowMinutes: z.number().int().min(1).max(60).default(10),
});
