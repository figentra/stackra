/**
 * Stackra file contract:
 * Purpose: `KpiProps`, props of the web Kpi: the shared contract plus HeroUI Pro's own card props, passed through
 *          unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 4); ADR 0303 (decision 7); ADR 0231 (acronyms
 *                     cased as words); STA-403 FR-007.
 */
import type { KPIRootProps as HeroKpiRootProps } from "@heroui-pro/react/kpi";

import type { KpiContractProps } from "#contracts/types/kpi-contract-props.type";

/** Props of the web Kpi: the shared contract plus HeroUI Pro's own card props, passed through unchanged. */
export type KpiProps = KpiContractProps & Omit<HeroKpiRootProps, keyof KpiContractProps>;
