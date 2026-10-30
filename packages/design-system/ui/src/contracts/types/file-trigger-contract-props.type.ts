/**
 * Stackra file contract:
 * Purpose: the props every runtime's `FileTrigger` takes: the source it opens, the accepted types, multiple
 *          selection and its button's look. Each runtime adds `onSelect` with its own file type (`File` on web,
 *          `PickedFile` on native) and passes its Button's other props through.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); design-system gap inventory row 6.
 */
import type { FileSource } from "#contracts/enums/file-source.enum";
import type { ButtonContractProps } from "#contracts/types/button-contract-props.type";

/** Props shared by the web and native `FileTrigger`. */
export interface FileTriggerContractProps extends Omit<
  ButtonContractProps,
  "onPress" | "isLoading"
> {
  /** What the button opens. Defaults to `files`; `photos` and `camera` accept images only. */
  readonly source?: FileSource | undefined;
  /** The MIME types (`image/*`, `application/pdf`) or extensions (`.csv`) the picker offers; all when empty. */
  readonly acceptedFileTypes?: readonly string[] | undefined;
  /** True to let the user pick more than one file; the camera always takes one. */
  readonly allowsMultiple?: boolean | undefined;
}
