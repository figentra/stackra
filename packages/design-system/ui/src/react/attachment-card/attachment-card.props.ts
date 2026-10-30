/**
 * Stackra file contract:
 * Purpose: `AttachmentCardProps`, the props of the web `AttachmentCard`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { AttachmentCardContractProps } from "#contracts/types/attachment-card-contract-props.type";

/** Props of the web AttachmentCard. */
export type AttachmentCardProps = AttachmentCardContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
