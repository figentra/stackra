/**
 * Stackra file contract:
 * Purpose: `BidiProps`, the props of the native `Bidi` in `bidi.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: design-system gap inventory row 1 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305 (rules
 *          10 and 12: one declaration per file); ADR 0060 (right-to-left).
 */
import type { TextProps, ViewProps } from "react-native";

import type { BidiContractProps } from "#contracts/types/bidi-contract-props.type";

/**
 * Props of the native Bidi: the shared contract plus the props of what it renders, a nested `Text` inline or a `View`
 * as a block; only the props both share pass through.
 */
export type BidiProps = BidiContractProps &
  Omit<Pick<TextProps & ViewProps, keyof TextProps & keyof ViewProps>, keyof BidiContractProps>;
