/**
 * Stackra file contract:
 * Purpose: `SystemBannerProps`, the props of the web `SystemBanner` in `system-banner.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); gap inventory row 27; ADR 0302.
 */
import type { SystemBannerContractProps } from "#contracts/types/system-banner-contract-props.type";
import type { AlertProps } from "#react/alert/alert.props";

/** Props of the web SystemBanner: the shared contract plus the Alert's pass-through props. */
export type SystemBannerProps = SystemBannerContractProps &
  Omit<AlertProps, keyof SystemBannerContractProps>;
