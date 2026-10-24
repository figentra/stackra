/**
 * Stackra file contract:
 * Purpose: the props both `ConfirmationProvider`s take, on web (`./react`) and native (`./native`): the app below it.
 * Boundary: types only. The provider draws the one dialog every `confirm` call in the app uses.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312.
 */
import type { ReactNode } from "react";

/** Props of the web and native `ConfirmationProvider`. */
export interface ConfirmationProviderContractProps {
  /** The app the provider wraps; any component below it can call `useConfirmation()`. */
  readonly children?: ReactNode;
}
