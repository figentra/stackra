/**
 * Stackra file contract:
 * Purpose: `ToggleButtonGroupContext`, what a native ToggleButtonGroup hands its ToggleButtons: which ids are pressed,
 *          how to toggle one, the shared size, whether all are refused, and whether the buttons are joined.
 * Boundary: internal; `undefined` outside a group, where a ToggleButton keeps its own state.
 * Runtime: react-native
 * Governing contract: ADR 0305 (one declaration per file); wave 3c mobile interactions (owner approval 2026-10-28).
 */
import { createContext } from "react";

import type { Size } from "#contracts/enums/size.enum";

/** The group's state as its buttons read it. */
export const ToggleButtonGroupContext = createContext<
  | {
      readonly selected: ReadonlySet<string>;
      readonly toggle: (id: string) => void;
      readonly size: Size | undefined;
      readonly isDisabled: boolean;
    }
  | undefined
>(undefined);
