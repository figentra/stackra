/**
 * Stackra file contract:
 * Purpose: `ChatToolGroupContractProps`, props of the `ChatToolGroup` root.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ReactNode } from "react";

/** Props of the `ChatToolGroup` root. */
export interface ChatToolGroupContractProps {
  /** Whether a tool in the group is running, which shimmers the group's trigger; HeroUI Pro's `active`. */
  readonly isActive?: boolean | undefined;
  /** The group's trigger and the collapsible content that holds its tool calls. */
  readonly children: ReactNode;
}
