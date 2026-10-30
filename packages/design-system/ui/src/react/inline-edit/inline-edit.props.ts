/**
 * Stackra file contract:
 * Purpose: `InlineEditProps`, the props of the web `InlineEdit` in `inline-edit.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); gap inventory row 5.
 */
import type { InlineEditContractProps } from "#contracts/types/inline-edit-contract-props.type";

/** Props of the web InlineEdit: the shared contract plus a class for the root. */
export type InlineEditProps = InlineEditContractProps & {
  /** Classes for the root element. */
  readonly className?: string | undefined;
};
