/**
 * Stackra file contract:
 * Purpose: `BulkActionBarProps`, the props of the native `BulkActionBar` in `bulk-action-bar.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0303 (decision 7); ADR 0318 (decisions 4 to 6 and 10); ADR 0139 (action UX); ADR 0060
 *          (right-to-left); WCAG 2.2 SC 2.5.8, 4.1.2, 4.1.3; owner decision 6 of STA-350 (thin wrappers).
 */
import type { ViewProps } from "react-native";
import type { BulkActionBarContractProps } from "#contracts/types/bulk-action-bar-contract-props.type";

/**
 * Props of the native BulkActionBar: the shared contract plus the props of a `View`, passed through unchanged. The
 * bar's own children are the actions, so the type refuses them.
 */
export type BulkActionBarProps = BulkActionBarContractProps &
  Omit<ViewProps, keyof BulkActionBarContractProps | "children">;
