/**
 * Stackra file contract:
 * Purpose: `CopyButtonProps`, the props of the web `CopyButton` in `copy-button.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory row 35.
 */
import type { CopyButtonContractProps } from "#contracts/types/copy-button-contract-props.type";
import type { IconButtonProps } from "#react/icon-button/icon-button.props";

/**
 * Props of the web CopyButton: the shared contract plus the IconButton's own props, passed through. The wrapper owns
 * the icon, the press and the name, so `icon`, `onPress` and `isLoading` are refused.
 */
export type CopyButtonProps = CopyButtonContractProps &
  Omit<IconButtonProps, keyof CopyButtonContractProps | "icon" | "onPress" | "isLoading">;
