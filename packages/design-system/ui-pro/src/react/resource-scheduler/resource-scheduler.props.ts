/**
 * Stackra file contract:
 * Purpose: `ResourceSchedulerProps`, props of the web ResourceScheduler.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); WCAG 2.2 SC 2.1.1 and 2.5.7 (a keyboard way
 *                     for every drag).
 */
import type { ResourceSchedulerContractProps } from "#contracts/types/resource-scheduler-contract-props.type";

/** Props of the web ResourceScheduler. */
export type ResourceSchedulerProps = ResourceSchedulerContractProps;
