/**
 * Stackra file contract:
 * Purpose: `ServiceAckService`, the module service over `ServiceAckSet`, the waiting side of the cross-service
 *          "service acked" contract: a workflow step expects acks from a list of services for a subject, and each
 *          `ServiceAcked` that arrives is recorded, with the records it kept, until the last expected service acked,
 *          which completes the set.
 * Boundary: a `CrudService<ServiceAckSet>` in the caller's transaction. `expect` runs in the step that asks the
 *           services to act (in the same transaction that records the request event), so no ack can come before its
 *           set; an ack for a subject nobody expects is ignored. `ack` only reports completion: the explorer holds
 *           `AllServicesAcked` in the same delivery, so a rolled-back delivery holds nothing. Two acks that land at
 *           once conflict on the set's version and the redelivered one completes it. The services expected are the
 *           caller's configuration, never code here.
 * Runtime: node
 * Governing contract: ADR 0210 (decision 6: provisioning waits for every service to ack); ADR 0427 (decision 1); ADR
 *                     0270 (decision 2); STA-1312 (what each service kept).
 */
import { CrudService } from "@stackra/database";

import type { KeptRecords } from "#core/index";
import type { ServiceAckSet } from "#node/models/service-ack-set.model";
import type { CompletedAcks } from "#node/types/completed-acks.type";

/** A member key. */
const SERVICE = /^[a-z][a-z0-9_]{0,62}$/;

/**
 * Keeps the acks a workflow waits for.
 *
 * @example
 * async request(run: Run<this>, ctx: StepContext): Promise<boolean> {
 *   ctx.record(ProvisioningRequested.create({ tenantId: run.input.tenantId }));
 *   return this.acks.expect(run.input.tenantId, this.config.services);
 * }
 */
export class ServiceAckService extends CrudService<ServiceAckSet> {
  /**
   * Expects an ack of `subject` from each of `services`; a second call for the same subject (a retried step) keeps the
   * first set. Two first calls for one subject at once: the later insert fails on the unique subject, and the step's
   * retry finds the set.
   *
   * @returns `true` when there is nothing to wait for (no services, or every one already acked).
   * @throws TypeError for a service that is not a member key, or a subject that is empty.
   */
  async expect(subject: string, services: readonly string[]): Promise<boolean> {
    if (subject === "" || services.some((service) => !SERVICE.test(service)))
      throw new TypeError(
        `ServiceAckService.expect: a subject and member keys such as "commerce" are required`,
      );
    const known = await this.findOne({ subject });
    if (known !== null) return known.completedAt !== null;
    const expected = [...new Set(services)];
    await this.insert({
      subject,
      expected,
      ...(expected.length === 0 ? { completedAt: new Date() } : {}),
    });
    return expected.length === 0;
  }

  /**
   * Records that `service` acked `subject`, keeping what it reports it kept (a redelivered ack replaces it).
   *
   * @returns the expected services and what each kept when this ack completed the set; `undefined` otherwise (still
   *          waiting, already complete, or a subject nobody expects).
   */
  async ack(
    subject: string,
    service: string,
    kept: readonly KeptRecords[] = [],
  ): Promise<CompletedAcks | undefined> {
    const set = await this.findOne({ subject });
    if (set === null || set.completedAt !== null) return undefined;
    if (!set.acked.includes(service)) set.acked = [...set.acked, service];
    if (kept.length > 0) set.kept = { ...set.kept, [service]: [...kept] };
    if (!set.expected.every((expected) => set.acked.includes(expected))) return undefined;
    set.completedAt = new Date();
    return { services: set.expected, kept: set.kept };
  }
}
