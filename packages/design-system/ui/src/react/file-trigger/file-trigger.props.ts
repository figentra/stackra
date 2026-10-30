/**
 * Stackra file contract:
 * Purpose: `FileTriggerProps`, the props of the web `FileTrigger` in `file-trigger.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory row 6.
 */
import type { FileTriggerContractProps } from "#contracts/types/file-trigger-contract-props.type";
import type { ButtonProps } from "#react/button/button.props";

/**
 * Props of the web FileTrigger: the shared contract, `onSelect` with the browser's `File` objects, and the Button's
 * own props, passed through. The press opens the picker, so `onPress` and `isLoading` are refused.
 */
export type FileTriggerProps = FileTriggerContractProps & {
  /** Called with the picked files; never called when the user cancels. */
  readonly onSelect?: ((files: readonly File[]) => void) | undefined;
} & Omit<ButtonProps, keyof FileTriggerContractProps | "onPress" | "isLoading" | "onSelect">;
