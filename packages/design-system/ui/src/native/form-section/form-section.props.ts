/**
 * Stackra file contract:
 * Purpose: `FormSectionProps`, the props of the native `FormSection` in `form-section.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, adapted forms); ADR
 *          0165 (HeroUI Native on native); ADR 0055 (forms); ADR 0303.
 */
import type { ViewProps } from "react-native";
import type { FormSectionContractProps } from "#contracts/types/form-section-contract-props.type";

/** Props of the native FormSection: the shared contract plus the props of a `View`, passed through unchanged. */
export type FormSectionProps = FormSectionContractProps &
  Omit<ViewProps, keyof FormSectionContractProps>;
