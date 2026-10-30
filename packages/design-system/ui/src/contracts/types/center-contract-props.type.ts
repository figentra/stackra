/**
 * Stackra file contract:
 * Purpose: `CenterContractProps`, the props every runtime's `Center` takes: a column centred in the space it is given,
 *          never wider than a reading measure, with a gutter on both sides.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave C).
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `Center`. */
export interface CenterContractProps {
  /** What is centred. */
  readonly children?: ReactNode;
  /** The widest the column gets: `sm` (24rem), `md` (32rem), `prose` (40rem, the default) or `lg` (56rem). */
  readonly maxWidth?: "sm" | "md" | "prose" | "lg" | undefined;
  /** True to centre the text inside the column as well (an empty state, a sign-in card). */
  readonly isTextCentered?: boolean | undefined;
}
