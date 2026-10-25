/**
 * Stackra file contract:
 * Purpose: `Schedulable`, the trait of a model whose changes can be scheduled: a future revision of the record, with
 *          its preview, its rollback and the campaigns that group several scheduled revisions.
 * Boundary: adds no field; applied with `HasRevisions`, whose side table holds the scheduled revision
 *           (`scheduled_at`, `campaign`). `RevisionService` schedules, previews, publishes what is due and rolls back;
 *           @stackra/scheduler only calls `publishDue` at its time (a tenant schedule, never a `@Cron`).
 * Runtime: node
 * Governing contract: ADR 0321 (decision 6: Schedulable); ADR 0148 (decision 5: tenant schedules).
 */
import { createTrait } from "@stackra/model";
import type { Trait } from "@stackra/model";

/**
 * The schedulable trait.
 *
 * @example
 * export class Product extends Model.with(HasPublicId("prd"), HasRevisions, Schedulable) {}
 */
export const Schedulable: Trait = createTrait("schedulable", (base) => class extends base {});
