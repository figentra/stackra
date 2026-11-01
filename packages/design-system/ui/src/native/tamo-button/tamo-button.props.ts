/**
 * Stackra file contract:
 * Purpose: `TamoButtonProps`, the props of the native `TamoButton` in `tamo-button.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { PressableProps } from "react-native";

import type { TamoButtonContractProps } from "#contracts/types/tamo-button-contract-props.type";

/** Props of the native TamoButton: the shared contract plus the Pressable's props (a Menu trigger's `asChild`). */
export type TamoButtonProps = TamoButtonContractProps &
  Omit<PressableProps, keyof TamoButtonContractProps | "children" | "disabled" | "style"> & {
    /** Classes added to the root. */
    readonly className?: string | undefined;
  };
