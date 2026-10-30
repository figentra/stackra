/**
 * Stackra file contract:
 * Purpose: `SaveStatusProps`, the props of the native `SaveStatus` in `save-status.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory row 8.
 */
import type { SaveStatusContractProps } from "#contracts/types/save-status-contract-props.type";
import type { InlineLoadingProps } from "#native/inline-loading/inline-loading.props";

/** Props of the native SaveStatus: the shared contract plus InlineLoading's `View` props, passed through unchanged. */
export type SaveStatusProps = SaveStatusContractProps &
  Omit<
    InlineLoadingProps,
    keyof SaveStatusContractProps | "status" | "loadingLabel" | "successLabel" | "errorLabel"
  >;
