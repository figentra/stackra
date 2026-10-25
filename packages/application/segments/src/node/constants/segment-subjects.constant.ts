/**
 * Stackra file contract:
 * Purpose: `SEGMENT_SUBJECTS`, the subject models segments may cover in this process, by model key: the model class
 *          (whose row changes the change consumer receives, named by class name) and the `SegmentSubject` class that
 *          lists its records and computes their facts.
 * Boundary: process-wide and internal: written by `registerSegmentSubjects`, read by `SegmentService` and
 *           `SubjectChangeService`. A key with no entry is no subject, so a segment cannot be created over it.
 * Runtime: node
 * Governing contract: ADR 0332 (decisions 1 and 3); ADR 0294 (decisions 20 and 22: locked identities).
 */
import type { AnyClass } from "@stackra/container";

import type { SegmentSubject } from "#contracts/index";

/** One registered subject model. */
interface SubjectEntry {
  /** The model class. */
  readonly model: AnyClass;

  /** The class that lists its records and computes their facts. */
  readonly type: AnyClass<SegmentSubject>;
}

/** Model key to its entry. */
export const SEGMENT_SUBJECTS = new Map<string, SubjectEntry>();
