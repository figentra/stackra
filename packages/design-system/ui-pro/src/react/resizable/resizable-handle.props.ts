/**
 * Stackra file contract:
 * Purpose: `ResizableHandleProps`, props of `Resizable.Handle`: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` and `disabled` renamed.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { ResizableHandleProps as HeroResizableHandleProps } from "@heroui-pro/react/resizable";

import type { ResizableHandleContractProps } from "#contracts/types/resizable-contract-props.type";

/** Props of `Resizable.Handle`: the shared contract plus HeroUI Pro's own, with `aria-label` and `disabled` renamed. */
export type ResizableHandleProps = ResizableHandleContractProps &
  Omit<HeroResizableHandleProps, keyof ResizableHandleContractProps | "aria-label" | "disabled">;
