/**
 * Stackra file contract:
 * Purpose: the props the web `CodeBlock` compound takes from the shared vocabulary: its children and the accessible
 *          name of the copy button.
 * Boundary: types only; web only. Every other prop (`code`, `language`, `theme`, `darkTheme`, the div props) is
 *          HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ReactNode } from "react";

/** Props of the `CodeBlock` root. */
export interface CodeBlockContractProps {
  /** The header, the code and the copy button. */
  readonly children: ReactNode;
}
