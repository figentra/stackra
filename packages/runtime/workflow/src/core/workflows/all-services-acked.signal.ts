/**
 * Stackra file contract:
 * Purpose: `AllServicesAcked`, the signal a workflow waits on until every service it expects has acked a subject
 *          (`ServiceAcked`): the subject, the services, in the order they were expected, and what each kept. Held with
 *          the correlation `{ subject }`.
 * Boundary: a signal, held in the transaction of the ack that completed the set; the waiting step receives it as its
 *           third argument. `ServiceAckService.expect` returns `true` when there is nothing to wait for (no services),
 *           so the waiting step's `when` can skip it.
 * Runtime: isomorphic
 * Governing contract: ADR 0210 (decision 6); ADR 0427 (decision 1); ADR 0152 (0294 note: held signals).
 */
import { Signal } from "#core/bases/signal.base";
import type { KeptRecords } from "#core/types/kept-records.type";

/**
 * Every expected service acked.
 *
 * @example
 * ```ts
 * @Step<ProvisionTenantWorkflow>({
 *   waitFor: AllServicesAcked,
 *   correlate: (run) => ({ subject: run.input.scopeId }),
 *   when: (run) => !run.results.request,
 *   timeout: "1h",
 * })
 * async provisioned(_run: Run<this>, _ctx: StepContext, acked: AllServicesAcked): Promise<string[]> {
 *   return acked.services;
 * }
 * ```
 */
export class AllServicesAcked extends Signal {
  /** The subject every service acked. */
  subject!: string;

  /** The services that acked it. */
  services!: string[];

  /** What each service kept, by member key; a service that kept nothing is absent (STA-1312). */
  kept!: Record<string, KeptRecords[]>;
}
