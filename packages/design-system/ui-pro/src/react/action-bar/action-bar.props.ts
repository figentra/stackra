/**
 * Stackra file contract:
 * Purpose: `ActionBarProps`, props of the web ActionBar: the shared contract plus HeroUI Pro's own toolbar props, with
 *          `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { ActionBarRootProps } from "@heroui-pro/react/action-bar";

import type { ActionBarContractProps } from "#contracts/types/action-bar-contract-props.type";

/**
 * Props of the web ActionBar: the shared contract plus HeroUI Pro's own toolbar props, with `aria-label` renamed
 * `label`.
 */
export type ActionBarProps = ActionBarContractProps &
  Omit<ActionBarRootProps, keyof ActionBarContractProps | "aria-label">;
