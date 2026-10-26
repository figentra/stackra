/**
 * Stackra file contract:
 * Purpose: `AlertProps`, the props of the native `Alert` in `alert.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312 (decisions 1 and 3); WCAG 2.2 SC 1.4.1 and 4.1.3.
 */
import type { AlertRootProps as HeroAlertRootProps } from "heroui-native";
import type { AlertContractProps } from "#contracts/types/alert-contract-props.type";
import type { DistributiveOmit } from "#contracts/types/distributive-omit.type";

/**
 * Props of the native Alert: the shared contract plus HeroUI Native's own alert props, passed through. HeroUI's
 * `status` is the contract's `tone`, and the role and live region are the tone's, never the caller's.
 */
export type AlertProps = AlertContractProps &
  DistributiveOmit<
    HeroAlertRootProps,
    keyof AlertContractProps | "children" | "status" | "role" | "aria-live"
  >;
