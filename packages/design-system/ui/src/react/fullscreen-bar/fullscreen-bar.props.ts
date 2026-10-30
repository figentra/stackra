/**
 * Stackra file contract:
 * Purpose: `FullscreenBarProps`, the props of the web `FullscreenBar` in `fullscreen-bar.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); GAPS.md row 32
 *          (owner decision 2026-10-28).
 */
import type { ComponentPropsWithoutRef } from "react";

import type { FullscreenBarContractProps } from "#contracts/types/fullscreen-bar-contract-props.type";

/**
 * Props of the web FullscreenBar: the shared contract plus the attributes of its root `header`, passed through. The
 * children are the bar's own, and `inert` and `aria-hidden` follow its visibility.
 */
export type FullscreenBarProps = FullscreenBarContractProps &
  Omit<
    ComponentPropsWithoutRef<"header">,
    keyof FullscreenBarContractProps | "children" | "inert" | "aria-hidden"
  >;
