/**
 * Stackra file contract:
 * Purpose: `InlineSelectProps`, props of the web InlineSelect: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { InlineSelectProps as HeroInlineSelectProps } from "@heroui-pro/react/inline-select";

import type { InlineSelectContractProps } from "#contracts/types/inline-select-contract-props.type";

/** Props of the web InlineSelect: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type InlineSelectProps<
  T extends object = object,
  M extends "single" | "multiple" = "single",
> = InlineSelectContractProps &
  Omit<HeroInlineSelectProps<T, M>, keyof InlineSelectContractProps | "aria-label">;
