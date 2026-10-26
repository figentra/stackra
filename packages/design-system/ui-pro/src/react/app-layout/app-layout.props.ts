/**
 * Stackra file contract:
 * Purpose: `AppLayoutProps`, props of the web AppLayout: the shared contract plus HeroUI Pro's own shell props, passed
 *          through unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */
import type { AppLayoutRootProps as HeroAppLayoutRootProps } from "@heroui-pro/react/app-layout";

import type { AppLayoutContractProps } from "#contracts/types/app-layout-contract-props.type";

/** Props of the web AppLayout: the shared contract plus HeroUI Pro's own shell props, passed through unchanged. */
export type AppLayoutProps = AppLayoutContractProps &
  Omit<HeroAppLayoutRootProps, keyof AppLayoutContractProps>;
