/**
 * Stackra file contract:
 * Purpose: `SetupGuideProps`, the props of the web `SetupGuide` in `setup-guide.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory row 17.
 */
import type { SetupGuideContractProps } from "#contracts/types/setup-guide-contract-props.type";
import type { CardProps } from "#react/card/card.props";

/** Props of the web SetupGuide: the shared contract plus the house Card's root props; the guide draws the children. */
export type SetupGuideProps = SetupGuideContractProps &
  Omit<CardProps, keyof SetupGuideContractProps | "children">;
