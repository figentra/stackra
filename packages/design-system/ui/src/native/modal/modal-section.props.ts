/**
 * Stackra file contract:
 * Purpose: `ModalSectionProps`, the props of the native modal and drawer sections (`ModalHeader`, `ModalBody`,
 *          `ModalFooter`).
 * Boundary: types only; the three parts and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, adapted forms); ADR
 *          0165 (HeroUI Native on native); ADR 0312.
 */
import type { ViewProps } from "react-native";

/** Props of the native Modal and Drawer sections: the props of a `View`, passed through unchanged. */
export type ModalSectionProps = ViewProps;
