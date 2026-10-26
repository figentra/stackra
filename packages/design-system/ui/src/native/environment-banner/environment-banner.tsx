/**
 * Stackra file contract:
 * Purpose: the native `EnvironmentBanner`: a persistent warning strip on the `Alert` that names a non-production
 *          environment, with its detail and actions; nothing in production.
 * Boundary: no dismiss control, by design; the caller places it above the page (the app layout, under the header).
 *           Announced as the Alert's warning tone announces.
 * Runtime: react-native
 * Governing contract: ADR 0280 (decision 5 and open detail 4); ADR 0302 (decision 3).
 */
import type { ReactElement } from "react";

import { Alert } from "#native/alert/alert";
import type { EnvironmentBannerProps } from "#native/environment-banner/environment-banner.props";

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
