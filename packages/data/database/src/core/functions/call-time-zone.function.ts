/**
 * Stackra file contract:
 * Purpose: `callTimeZone`, the time zone of the running call (`ctx.timeZone`) a metrics series buckets in when its
 *          caller names none.
 * Boundary: internal; reads the running context through the resolver `connectVisibilityFilter` connected. Outside a
 *           call, or with no resolver, it is UTC.
 * Runtime: node
 * Governing contract: ADR 0136 (decision 1: the time zone is on the context); reporting gap 10.
 */
import type { ExtensionContext } from "@stackra/actions";
import { ContextStorage } from "@stackra/actions/contracts";

import { VISIBILITY_HOST } from "#core/constants/visibility-host.constant";

/**
 * The running call's time zone, or `"UTC"`.
 *
 * @example
 * callTimeZone(); // "Asia/Riyadh" inside a call from Riyadh
 */
export function callTimeZone(): string {
  const { resolver } = VISIBILITY_HOST;
  if (resolver === undefined || !resolver.has(ContextStorage)) return "UTC";
  const context = resolver.get(ContextStorage).current() as ExtensionContext | undefined;
  return context?.timeZone ?? "UTC";
}
