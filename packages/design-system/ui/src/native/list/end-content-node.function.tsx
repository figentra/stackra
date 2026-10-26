/**
 * Stackra file contract:
 * Purpose: `endContentNode`: end content as the row can draw it.
 * Boundary: a pure function; no state, no I/O.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0313 (text slots); ADR 0165 (HeroUI Native on native); WCAG 2.2 SC 2.5.8 (target size).
 */
import { ListGroup } from "heroui-native";
import type { ReactNode } from "react";

/** End content as the row can draw it: a string or number goes into the description text, any other node as it is. */
export function endContentNode(endContent: ReactNode): ReactNode {
  return typeof endContent === "string" || typeof endContent === "number" ? (
    <ListGroup.ItemDescription>{endContent}</ListGroup.ItemDescription>
  ) : (
    endContent
  );
}
