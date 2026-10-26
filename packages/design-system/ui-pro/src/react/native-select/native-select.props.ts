/**
 * Stackra file contract:
 * Purpose: `NativeSelectProps`, props of the web NativeSelect: the shared contract plus HeroUI Pro's own, with
 *          `fullWidth` renamed `isFullWidth`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { NativeSelectProps as HeroNativeSelectProps } from "@heroui-pro/react/native-select";

import type { NativeSelectContractProps } from "#contracts/types/native-select-contract-props.type";

/** Props of the web NativeSelect: the shared contract plus HeroUI Pro's own, with `fullWidth` renamed `isFullWidth`. */
export type NativeSelectProps = NativeSelectContractProps &
  Omit<HeroNativeSelectProps, keyof NativeSelectContractProps | "fullWidth">;
