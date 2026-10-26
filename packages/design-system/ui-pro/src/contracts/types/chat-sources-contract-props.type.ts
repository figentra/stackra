/**
 * Stackra file contract:
 * Purpose: `ChatSourcesContractProps`, props of the `ChatSources` root.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ReactNode } from "react";

/** Props of the `ChatSources` root. */
export interface ChatSourcesContractProps {
  /** The trigger and the collapsible content that holds the list of sources. */
  readonly children: ReactNode;
}
