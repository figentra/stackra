/**
 * Stackra file contract:
 * Purpose: `adClickIdOf(url, params)`, the ad click id a landing URL carries (`?gclid=...`): the parameter it came in
 *          and its value, for the host to keep with the visit and hand to the order, whose integration event the
 *          server `Conversion` reads `clickId` from.
 * Boundary: pure; reads the query only. It stores nothing: a click id is an ad identifier, so a host keeps it only
 *           once `marketing` is granted (the conversion bridge refuses without it anyway). A malformed URL or a blank
 *           value is `null`.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decision 1); ADR 0355 (decision 1); analytics gap 12 (stackra-412).
 */
import { AD_CLICK_ID_PARAMS } from "#core/constants/ad-click-id-params.constant";

/**
 * The first click id in `url`'s query, by `params` order.
 *
 * @param url - the landing URL, absolute.
 * @param params - the parameters to look for; the four platforms' by default.
 * @example
 * adClickIdOf("https://shop.example/?gclid=Cj0K&utm_source=g"); // { param: "gclid", id: "Cj0K" }
 */
export function adClickIdOf(
  url: string,
  params: readonly string[] = AD_CLICK_ID_PARAMS,
): { readonly param: string; readonly id: string } | null {
  if (!URL.canParse(url)) return null;
  const query = new URL(url).searchParams;
  for (const param of params) {
    const id = query.get(param)?.trim();
    if (id) return { param, id };
  }
  return null;
}
