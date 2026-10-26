/**
 * Stackra file contract:
 * Purpose: `SectionProps`, the props of the native `Section` in `section.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, adapted forms); ADR
 *          0303 (decision 7); ADR 0317 (decisions 1, 4 and 7); WCAG 2.2 SC 1.3.1, 2.4.6 and 2.5.8.
 */
import type { SectionContractProps } from "#contracts/types/section-contract-props.type";
import type { CardProps } from "#native/card/card.props";

/**
 * Props of the native Section: the shared contract plus the card's own props, passed through. The card's
 * `accessibilityLabel` is the contract's `label`, so the type refuses it.
 */
export type SectionProps = SectionContractProps &
  Omit<CardProps, keyof SectionContractProps | "accessibilityLabel">;
