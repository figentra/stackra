/**
 * Stackra file contract:
 * Purpose: `VisuallyHiddenProps`, the props of the native `VisuallyHidden` in `visually-hidden.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: design-system gap inventory row 19 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305.
 */
import type { TextProps } from "react-native";

import type { VisuallyHiddenContractProps } from "#contracts/types/visually-hidden-contract-props.type";

/** Props of the native VisuallyHidden: the shared contract plus a `Text`'s props; the style is its own. */
export type VisuallyHiddenProps = VisuallyHiddenContractProps &
  Omit<TextProps, keyof VisuallyHiddenContractProps | "style">;
