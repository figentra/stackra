/**
 * Stackra file contract:
 * Purpose: `CopyButtonProps`, the props of the native `CopyButton` in `copy-button.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory row 35.
 */
import type { DistributiveOmit } from "#contracts/types/distributive-omit.type";
import type { CopyButtonContractProps } from "#contracts/types/copy-button-contract-props.type";
import type { IconButtonProps } from "#native/icon-button/icon-button.props";

/**
 * Props of the native CopyButton: the shared contract plus the IconButton's own props, passed through. The wrapper
 * owns the icon, the press and the name, so `icon`, `onPress` and `isLoading` are refused.
 */
export type CopyButtonProps = CopyButtonContractProps &
  DistributiveOmit<
    IconButtonProps,
    keyof CopyButtonContractProps | "icon" | "onPress" | "isLoading"
  >;
