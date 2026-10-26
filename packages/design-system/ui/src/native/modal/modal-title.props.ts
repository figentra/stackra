/**
 * Stackra file contract:
 * Purpose: `ModalTitleProps`, the props of the native `ModalTitle` in `modal-title.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312; WCAG 2.2
 *          SC 1.3.1 and 4.1.2.
 */
import type { DialogTitleProps as HeroDialogTitleProps } from "heroui-native";
import type { OverlayTitleContractProps } from "#contracts/types/overlay-title-contract-props.type";

/** Props of the native Modal.Title: the shared contract plus HeroUI Native's own title props, passed through. */
export type ModalTitleProps = OverlayTitleContractProps &
  Omit<HeroDialogTitleProps, keyof OverlayTitleContractProps>;
