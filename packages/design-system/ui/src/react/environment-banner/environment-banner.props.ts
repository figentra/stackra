/**
 * Stackra file contract:
 * Purpose: `EnvironmentBannerProps`, the props of the web `EnvironmentBanner` in `environment-banner.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0280 (decision 5 and open detail 4);
 *          ADR 0302 (decision 3).
 */
import type { EnvironmentBannerContractProps } from "#contracts/types/environment-banner-contract-props.type";

/** Props of the web EnvironmentBanner. */
export type EnvironmentBannerProps = EnvironmentBannerContractProps;
