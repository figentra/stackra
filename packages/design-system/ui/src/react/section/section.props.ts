/**
 * Stackra file contract:
 * Purpose: `SectionProps`, the props of the web `Section` in `section.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, decision 5: adapted
 *          form); ADR 0303 (decision 7); ADR 0317 (decisions 1, 4 and 5); ADR 0165 (HeroUI v3 on web); WCAG 2.2 SC
 *          1.3.1, 2.4.6 and 2.5.8.
 */
import type { SectionContractProps } from "#contracts/types/section-contract-props.type";
import type { CardProps } from "#react/card/card.props";

/**
 * Props of the web Section: the shared contract plus the card's own props, passed through. The element's `aria-label`
 * is the contract's `label` and `aria-labelledby` is the title's, so the type refuses both; its `title` attribute gives
 * way to the contract's `title`, and the element is a `section`, so `render` is not a prop here.
 */
export type SectionProps = SectionContractProps &
  Omit<CardProps, keyof SectionContractProps | "aria-label" | "aria-labelledby" | "render">;
