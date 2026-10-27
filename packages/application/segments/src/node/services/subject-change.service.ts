/**
 * Stackra file contract:
 * Purpose: `SubjectChangeService`, the outbox change consumer of every registered subject model: a committed change of
 *          a subject's row recomputes that subject's membership in each dynamic segment over its model.
 * Boundary: a `ChangeConsumer`, registered against each subject model by `registerSegmentSubjects` and resolved by the
 *           relay, which calls it at least once per change in the row's scope session. Recomputing is idempotent, so a
 *           redelivery changes nothing; a deleted row has no facts, so it leaves every segment. A change of a model no
 *           subject names is ignored.
 * Runtime: node
 * Governing contract: ADR 0332 (decision 3: recomputed on the subject's changes); ADR 0221 (decision 5); ADR 0078
 *                     (decision 4: idempotent consumers).
 */
import { Service } from "@stackra/container";
import type { ChangeConsumer, RowChange } from "@stackra/outbox/contracts";

import { SEGMENT_SUBJECTS } from "#node/constants/segment-subjects.constant";
import type { SegmentService } from "#node/services/segment.service";

/**
 * Recomputes the membership of a changed subject.
 *
 * @example
 * registerSegmentSubjects([{ key: "commerce.customer", model: Customer, type: CustomerSegmentSubject }]);
 * // every committed Customer change now reaches consume(change)
 */
export class SubjectChangeService extends Service implements ChangeConsumer {
  /** Recomputes membership. */
  private readonly segments: SegmentService;

  /**
   * @param segments - the segment service.
   */
  constructor(segments: SegmentService) {
    super();
    this.segments = segments;
  }

  /** Recomputes the changed row's membership when its model is a subject. */
  async consume(change: RowChange): Promise<void> {
    const [key] =
      [...SEGMENT_SUBJECTS].find(([, entry]) => entry.model.name === change.model) ?? [];
    if (key !== undefined) await this.segments.recomputeSubject({ model: key, id: change.id });
  }
}
