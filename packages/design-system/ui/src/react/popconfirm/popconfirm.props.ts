/**
 * Stackra file contract:
 * Purpose: `PopconfirmProps`, the props of the web `Popconfirm`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D).
 */
import type { PopconfirmContractProps } from "#contracts/types/popconfirm-contract-props.type";

/** Props of the web Popconfirm. */
export type PopconfirmProps = PopconfirmContractProps & {
  /** Styles the popover's content. */
  readonly className?: string | undefined;
};
