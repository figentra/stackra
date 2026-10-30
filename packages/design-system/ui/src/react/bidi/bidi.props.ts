/**
 * Stackra file contract:
 * Purpose: `BidiProps`, the props of the web `Bidi` in `bidi.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: design-system gap inventory row 1 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305 (rules
 *          10 and 12: one declaration per file); ADR 0060 (right-to-left).
 */
import type { HTMLAttributes } from "react";

import type { BidiContractProps } from "#contracts/types/bidi-contract-props.type";

/** Props of the web Bidi: the shared contract plus the element's own attributes, `dir` and `children` excepted. */
export type BidiProps = BidiContractProps &
  Omit<HTMLAttributes<HTMLElement>, keyof BidiContractProps>;
