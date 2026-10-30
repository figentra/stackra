/**
 * Stackra file contract:
 * Purpose: `UploadListProps`, the props of the native `UploadList` in `upload-list.tsx`, the FileTrigger's companion.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory row 6.
 */
import type { ViewProps } from "react-native";
import type { UploadListContractProps } from "#contracts/types/upload-list-contract-props.type";

/**
 * Props of the native UploadList: the shared contract plus the root `View`'s own props, passed through. The wrapper
 * draws the rows and `label` names the list, so `children`, `accessibilityRole` and `accessibilityLabel` are refused.
 */
export type UploadListProps = UploadListContractProps &
  Omit<
    ViewProps,
    keyof UploadListContractProps | "children" | "accessibilityRole" | "accessibilityLabel"
  >;
