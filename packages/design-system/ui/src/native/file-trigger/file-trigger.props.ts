/**
 * Stackra file contract:
 * Purpose: `FileTriggerProps`, the props of the native `FileTrigger` in `file-trigger.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory row 6.
 */
import type { DistributiveOmit } from "#contracts/types/distributive-omit.type";
import type { FileTriggerContractProps } from "#contracts/types/file-trigger-contract-props.type";
import type { PickedFile } from "#contracts/types/picked-file.type";
import type { ButtonProps } from "#native/button/button.props";

/**
 * Props of the native FileTrigger: the shared contract, `onSelect` with the picked files' URIs, and the Button's own
 * props, passed through. The press opens the picker, so `onPress` and `isLoading` are refused.
 */
export type FileTriggerProps = FileTriggerContractProps & {
  /** Called with the picked files; never called when the user cancels or refuses the camera. */
  readonly onSelect?: ((files: readonly PickedFile[]) => void) | undefined;
} & DistributiveOmit<
    ButtonProps,
    keyof FileTriggerContractProps | "onPress" | "isLoading" | "onSelect"
  >;
