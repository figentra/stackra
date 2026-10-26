/**
 * Stackra file contract:
 * Purpose: `DescriptionProps`, the props of the web `Description` in `description.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI v3
 *          on web); ADR 0055 (forms); ADR 0303.
 */
import type { DescriptionRootProps } from "@heroui/react";
import type { DescriptionContractProps } from "#contracts/types/description-contract-props.type";

/** Props of the web Description: the shared contract plus HeroUI v3's own description props, passed through. */
export type DescriptionProps = DescriptionContractProps &
  Omit<DescriptionRootProps, keyof DescriptionContractProps>;
