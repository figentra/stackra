/**
 * Stackra file contract:
 * Purpose: `ResourceSchedulerProps`, props of the native ResourceScheduler.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); WCAG 2.2 SC 2.5.7 (a single-pointer way for
 *                     every drag).
 */
import type { ResourceSchedulerContractProps } from "#contracts/types/resource-scheduler-contract-props.type";

/** Props of the native ResourceScheduler. */
export type ResourceSchedulerProps = ResourceSchedulerContractProps;
