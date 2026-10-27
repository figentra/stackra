/**
 * Stackra file contract:
 * Purpose: `ServiceAckSet`, the acks a workflow waits for on one subject: the services expected, the services that
 *          acked so far, what each kept (`KeptRecords`) and when the set completed.
 * Boundary: data only. Key `workflow.service_ack_set`, table `workflow.service_ack_sets`. Platform data like the
 *           journal (a subject spans services and scopes), so the table has no row-level-security policy. One row per
 *           subject, versioned: two acks that land at once conflict, and the redelivered one re-reads the row, so the
 *           completing ack is never lost. Rows are added through `ServiceAckService.expect`, never with `new`.
 * Runtime: node
 * Governing contract: ADR 0210 (decision 6); ADR 0427 (decision 1); ADR 0294 (decisions 4, 11, 20 and 27);
 *                     STA-1312 (`kept`).
 */
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps, Versioned } from "@stackra/model";

import type { KeptRecords } from "#core/index";

/** One subject's acks. Traits add `id`, the timestamps and the version; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class ServiceAckSet extends Model.with(HasPublicId("wfk"), Timestamps, Versioned) {
  /** What the acks are for (a tenant's public id). */
  subject!: string;

  /** The member keys of the services expected to ack, in order. */
  expected!: string[];

  /** The member keys of the services that acked so far. */
  acked: string[] = [];

  /** What each service that acked kept, by member key; a service that kept nothing is absent. */
  kept: Record<string, KeptRecords[]> = {};

  /** When the last expected service acked; null while one is missing. */
  completedAt: Date | null = null;
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so `CrudService.insert` may leave the defaulted
// fields out; remove it once gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface ServiceAckSet {
  [OptionalProps]?: "createdAt" | "updatedAt" | "version" | "acked" | "kept" | "completedAt";
}
