/**
 * Stackra file contract:
 * Purpose: `StatusIndicatorProps`, the props of the web `StatusIndicator` in `status-indicator.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); gap inventory row 30; WCAG 2.2 SC 1.4.1.
 */
import type { ComponentPropsWithoutRef } from "react";

import type { StatusIndicatorContractProps } from "#contracts/types/status-indicator-contract-props.type";

/** Props of the web StatusIndicator: the shared contract plus the attributes of its `span`. */
export type StatusIndicatorProps = StatusIndicatorContractProps &
  Omit<ComponentPropsWithoutRef<"span">, keyof StatusIndicatorContractProps>;
