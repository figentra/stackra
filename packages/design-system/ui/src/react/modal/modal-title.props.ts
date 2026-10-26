/**
 * Stackra file contract:
 * Purpose: `ModalTitleProps`, the props of the web `ModalTitle` in `modal-title.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312; WCAG 2.2
 *          SC 1.3.1 and 4.1.2.
 */
import type { ModalHeadingProps as HeroModalHeadingProps } from "@heroui/react";
import type { OverlayTitleContractProps } from "#contracts/types/overlay-title-contract-props.type";

/** Props of the web Modal.Title: the shared contract plus HeroUI v3's own heading props, passed through. */
export type ModalTitleProps = OverlayTitleContractProps &
  Omit<HeroModalHeadingProps, keyof OverlayTitleContractProps>;
