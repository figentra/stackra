/**
 * Stackra file contract:
 * Purpose: `SchematicNodeProps`, the props of the web `SchematicNode` in `schematic-node.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); STA-2041.
 */
import type { ReactNode } from "react";

/** Props of the web SchematicNode. */
export interface SchematicNodeProps {
  /** The node's name in the machine's links; never shown and not a DOM id. */
  readonly id: string;
  /** The part itself, such as a schematic `Frame`. */
  readonly children: ReactNode;
  /** Styles the node, such as its grid placement. */
  readonly className?: string | undefined;
}
