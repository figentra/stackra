/**
 * Stackra file contract:
 * Purpose: `SlideToConfirmProps`, the props of the native `SlideToConfirm` in `slide-to-confirm.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ViewProps } from "react-native";
import type { SlideToConfirmContractProps } from "#contracts/types/slide-to-confirm-contract-props.type";

/** Props of the native SlideToConfirm: the shared contract plus the root's own props, passed through. */
export type SlideToConfirmProps = SlideToConfirmContractProps &
  Omit<ViewProps, keyof SlideToConfirmContractProps>;
