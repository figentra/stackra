/**
 * Stackra file contract:
 * Purpose: `VisuallyHiddenProps`, the props of the web `VisuallyHidden` in `visually-hidden.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: design-system gap inventory row 19 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305.
 */
import type { VisuallyHiddenProps as AriaVisuallyHiddenProps } from "react-aria-components";

import type { VisuallyHiddenContractProps } from "#contracts/types/visually-hidden-contract-props.type";

/** Props of the web VisuallyHidden: the shared contract plus React Aria's own (`elementType`, `isFocusable`). */
export type VisuallyHiddenProps = VisuallyHiddenContractProps &
  Omit<AriaVisuallyHiddenProps, keyof VisuallyHiddenContractProps>;
