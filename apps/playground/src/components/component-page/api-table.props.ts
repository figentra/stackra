/**
 * Stackra file contract:
 * Purpose: `ApiTableProps`, props of one part's API: the part.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); showcase redesign spec (2026-10-27) section 4 (row 9).
 */
import type { ApiPart } from "@stackra/showcase";

/** Props of `ApiTable`. */
export interface ApiTableProps {
  /** The part whose API the table lists. */
  readonly part: ApiPart;
}
