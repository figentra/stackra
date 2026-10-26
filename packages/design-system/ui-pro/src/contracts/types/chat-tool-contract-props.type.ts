/**
 * Stackra file contract:
 * Purpose: the props the web `ChatTool` and `ChatToolGroup` compounds take from the shared vocabulary: whether the
 *          tool call is running, and the group's children.
 * Boundary: types only; web only. Every other prop (`state`, `toolName`, `input`, `output`, `onApprove`, the
 *          disclosure props) is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */

/** Props of the `ChatTool` root that the Stackra vocabulary names. */
export interface ChatToolContractProps {
  /** Whether the tool is running, which shimmers its row; HeroUI Pro's `active`. Running while `state` is in progress when left out. */
  readonly isActive?: boolean | undefined;
}
