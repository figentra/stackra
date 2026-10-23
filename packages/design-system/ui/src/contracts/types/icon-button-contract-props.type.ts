/**
 * Stackra file contract:
 * Purpose: the props every runtime's `IconButton` takes: a Button with one icon and no visible text, whose
 *          accessible name is required by the type.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (UI contract); WCAG 2.2 SC 4.1.2 (name,
 *          role, value).
 */
import type { ReactNode } from "react";

import type { ButtonContractProps } from "#contracts/types/button-contract-props.type";

/** Props shared by the web and native `IconButton`. */
export interface IconButtonContractProps extends Omit<
  ButtonContractProps,
  "children" | "startIcon" | "endIcon" | "isFullWidth" | "label"
> {
  /** The icon the button shows; any icon element. */
  readonly icon: ReactNode;
  /** The accessible name, read by screen readers in place of text; required because nothing else names it. */
  readonly label: string;
}
