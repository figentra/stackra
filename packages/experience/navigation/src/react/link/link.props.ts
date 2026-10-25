/**
 * Stackra file contract:
 * Purpose: `LinkProps`, the props of `Link`: React Router's link props with `to` widened to any `RouteTarget`, plus the
 *          target's `params`, `search` and `hash`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0303 (decision 1).
 */
import type { LinkProps as RouterLinkProps } from "react-router";

import type { HrefParams } from "#core/types/href-params.type";
import type { RouteTarget } from "#core/types/route-target.type";

/** Props of `Link`. */
export type LinkProps = Omit<RouterLinkProps, "to"> & {
  /** Where the link goes. */
  readonly to: RouteTarget;
  /** The target's path params (`{ slug }`). */
  readonly params?: Readonly<Record<string, string | number>> | undefined;
  /** The query string. */
  readonly search?: HrefParams["search"];
  /** The fragment, without `#`. */
  readonly hash?: string | undefined;
};
