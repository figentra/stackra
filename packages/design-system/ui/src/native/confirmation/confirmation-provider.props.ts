/**
 * Stackra file contract:
 * Purpose: `ConfirmationProviderProps`, the props of the native `ConfirmationProvider` in `confirmation-provider.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, adapted forms); ADR
 *          0312; WCAG 2.2 SC 3.3.4.
 */
import type { ConfirmationProviderContractProps } from "#contracts/types/confirmation-provider-contract-props.type";

/** Props of the native ConfirmationProvider: the app it wraps. */
export type ConfirmationProviderProps = ConfirmationProviderContractProps;
