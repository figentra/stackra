/**
 * Stackra file contract:
 * Purpose: `LabelProps`, the props of the web `Label` in `label.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI v3
 *          on web); ADR 0055 (forms); ADR 0303.
 */
import type { LabelRootProps } from "@heroui/react";
import type { LabelContractProps } from "#contracts/types/label-contract-props.type";

/** Props of the web Label: the shared contract plus HeroUI v3's own label props, passed through unchanged. */
export type LabelProps = LabelContractProps & Omit<LabelRootProps, keyof LabelContractProps>;
