/**
 * Stackra file contract:
 * Purpose: `SystemBannerProps`, the props of the native `SystemBanner` in `system-banner.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); gap inventory row 27; ADR 0302.
 */
import type { DistributiveOmit } from "#contracts/types/distributive-omit.type";
import type { SystemBannerContractProps } from "#contracts/types/system-banner-contract-props.type";
import type { AlertProps } from "#native/alert/alert.props";

/** Props of the native SystemBanner: the shared contract plus the Alert's pass-through props. */
export type SystemBannerProps = SystemBannerContractProps &
  DistributiveOmit<AlertProps, keyof SystemBannerContractProps>;
