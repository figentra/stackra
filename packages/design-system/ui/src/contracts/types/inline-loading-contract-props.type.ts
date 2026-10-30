/**
 * Stackra file contract:
 * Purpose: the props every runtime's `InlineLoading` takes: its state and the text of each state. Each runtime's
 *          `InlineLoadingProps` is this plus its own base props.
 * Boundary: types only. The component never changes the state: the app sets it from its save or payment.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); WCAG 2.2 SC 4.1.3 (status messages); design-system
 *          gap inventory row 28.
 */
import type { InlineLoadingStatus } from "#contracts/enums/inline-loading-status.enum";

/** Props shared by the web and native `InlineLoading`. */
export interface InlineLoadingContractProps {
  /** What is happening; `idle` draws nothing but keeps the live region in place. */
  readonly status: InlineLoadingStatus;
  /** The text beside the spinner, for example "Charging card". Defaults to the `ui` catalogue's "Loading". */
  readonly loadingLabel?: string | undefined;
  /** The text beside the check, for example "Paid". Defaults to the `ui` catalogue's "Done". */
  readonly successLabel?: string | undefined;
  /** The text beside the alert icon, for example "Card declined". Defaults to the `ui` catalogue's "Failed". */
  readonly errorLabel?: string | undefined;
}
