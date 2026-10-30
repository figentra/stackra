/**
 * Stackra file contract:
 * Purpose: `FormErrorSummaryProps`, the props of the native `FormErrorSummary`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (forms); STA-1371.
 */
import type { FormErrorSummaryContractProps } from "#contracts/types/form-error-summary-contract-props.type";

/** Props of the native FormErrorSummary. */
export type FormErrorSummaryProps = FormErrorSummaryContractProps & {
  /** Classes for the box, such as a margin. */
  readonly className?: string | undefined;
};
