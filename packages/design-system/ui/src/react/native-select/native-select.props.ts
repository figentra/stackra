/**
 * Stackra file contract:
 * Purpose: `NativeSelectProps`, the props of the web `NativeSelect`.
 * Boundary: types only; the contract plus the HTML `select`'s own props.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { ComponentPropsWithoutRef } from "react";

import type { NativeSelectContractProps } from "#contracts/types/native-select-contract-props.type";

/** Props of the web NativeSelect. */
export type NativeSelectProps = NativeSelectContractProps &
  Omit<ComponentPropsWithoutRef<"select">, keyof NativeSelectContractProps | "children">;
