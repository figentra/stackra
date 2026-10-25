/**
 * Stackra file contract:
 * Purpose: the web `EnvironmentBanner`: a persistent warning strip on the `Alert` that names a non-production
 *          environment, with its detail and actions; nothing in production.
 * Boundary: no dismiss control, by design; the caller places it above the page (the panel shell and app layouts).
 *           Announced as the Alert's warning tone announces.
 * Runtime: browser
 * Governing contract: ADR 0280 (decision 5 and open detail 4); ADR 0302 (decision 3).
 */
import type { ReactElement } from "react";

import type { EnvironmentBannerContractProps } from "#contracts/types/environment-banner-contract-props.type";
import { Alert } from "#react/alert/alert";

/** Props of the web EnvironmentBanner. */
export type EnvironmentBannerProps = EnvironmentBannerContractProps;

/** Names the environment the viewer is in, unless it is production. */
export function EnvironmentBanner({
  environment,
  isProduction,
  description,
  actions,
}: EnvironmentBannerProps): ReactElement | null {
  if (isProduction) return null;
  return <Alert tone="warning" title={environment} description={description} actions={actions} />;
}
