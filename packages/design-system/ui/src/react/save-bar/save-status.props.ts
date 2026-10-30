/**
 * Stackra file contract:
 * Purpose: `SaveStatusProps`, the props of the web `SaveStatus` in `save-status.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory row 8.
 */
import type { SaveStatusContractProps } from "#contracts/types/save-status-contract-props.type";
import type { InlineLoadingProps } from "#react/inline-loading/inline-loading.props";

/** Props of the web SaveStatus: the shared contract plus InlineLoading's `span` props, passed through unchanged. */
export type SaveStatusProps = SaveStatusContractProps &
  Omit<
    InlineLoadingProps,
    keyof SaveStatusContractProps | "status" | "loadingLabel" | "successLabel" | "errorLabel"
  >;
