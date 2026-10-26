/**
 * Stackra file contract:
 * Purpose: `SeparatorProps`, the props of the web `Separator` in `separator.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI v3
 *          on web); ADR 0304.
 */
import type { SeparatorRootProps } from "@heroui/react";
import type { SeparatorContractProps } from "#contracts/types/separator-contract-props.type";

/** Props of the web Separator: the shared contract plus HeroUI v3's own separator props, passed through unchanged. */
export type SeparatorProps = SeparatorContractProps &
  Omit<SeparatorRootProps, keyof SeparatorContractProps>;
