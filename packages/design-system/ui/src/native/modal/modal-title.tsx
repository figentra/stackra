/**
 * Stackra file contract:
 * Purpose: the native `Modal.Title`: HeroUI Native's dialog title, a heading-role `Text` linked to the dialog's
 *          accessibility label; `level` is accepted and dropped (React Native has no heading level).
 * Boundary: reached as `Modal.Title`; the barrel exports only its props type. It must sit inside the modal.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 1.3.1 and 4.1.2.
 */
import { Dialog, type DialogTitleProps as HeroDialogTitleProps } from "heroui-native";
import type { ReactElement } from "react";

import type { OverlayTitleContractProps } from "#contracts/types/overlay-title-contract-props.type";

/** Props of the native Modal.Title: the shared contract plus HeroUI Native's own title props, passed through. */
export type ModalTitleProps = OverlayTitleContractProps &
  Omit<HeroDialogTitleProps, keyof OverlayTitleContractProps>;

/** The modal's title. `level` keeps the shared contract and is not used: the heading role carries no level. */
export function ModalTitle({ level: _level, ...rest }: ModalTitleProps): ReactElement {
  return <Dialog.Title {...rest} />;
}
