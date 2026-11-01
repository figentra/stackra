/**
 * Stackra file contract:
 * Purpose: `TamoButtonProps`, the props of the web `TamoButton` in `tamo-button.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { Ref } from "react";
import type { ButtonProps as AriaButtonProps } from "react-aria-components";

import type { TamoButtonContractProps } from "#contracts/types/tamo-button-contract-props.type";

/** Props of the web TamoButton: the shared contract plus React Aria's button props (a menu or popover trigger's). */
export type TamoButtonProps = TamoButtonContractProps &
  Omit<AriaButtonProps, keyof TamoButtonContractProps | "children" | "className" | "style"> & {
    /** Classes added to the root. */
    readonly className?: string | undefined;
    readonly ref?: Ref<HTMLButtonElement> | undefined;
  };
