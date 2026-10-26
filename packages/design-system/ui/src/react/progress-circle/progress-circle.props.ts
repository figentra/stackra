/**
 * Stackra file contract:
 * Purpose: `ProgressCircleProps`, the props of the web `ProgressCircle` in `progress-circle.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312; ADR 0165 (HeroUI v3 on web); owner decision 6 of STA-350 (thin wrappers); WCAG 2.2 SC 4.1.2.
 */
import type { ProgressCircleRootProps } from "@heroui/react";
import type { ProgressCircleContractProps } from "#contracts/types/progress-circle-contract-props.type";

/**
 * Props of the web ProgressCircle: the shared contract plus HeroUI v3's own progress circle props, passed through
 * unchanged. HeroUI's `color` is the contract's `tone`, `isIndeterminate` follows from a missing `value`, `label` owns
 * the accessible name, and the parts are drawn here, so `children` is refused; the value's number format is
 * `valueLabel`, so `formatOptions` is too.
 */
export type ProgressCircleProps = ProgressCircleContractProps &
  Omit<
    ProgressCircleRootProps,
    | keyof ProgressCircleContractProps
    | "color"
    | "children"
    | "isIndeterminate"
    | "formatOptions"
    | "aria-label"
    | "aria-labelledby"
  >;
