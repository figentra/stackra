/**
 * Stackra file contract:
 * Purpose: `KpiGroupProps`, props of the web KpiGroup: the shared contract plus HeroUI Pro's own group props, passed
 *          through unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0231 (acronyms
 *                     cased as words); STA-416 FR-005.
 */
import type { KPIGroupRootProps } from "@heroui-pro/react/kpi-group";

import type { KpiGroupContractProps } from "#contracts/types/kpi-group-contract-props.type";

/** Props of the web KpiGroup: the shared contract plus HeroUI Pro's own group props, passed through unchanged. */
export type KpiGroupProps = KpiGroupContractProps &
  Omit<KPIGroupRootProps, keyof KpiGroupContractProps>;
