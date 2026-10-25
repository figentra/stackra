/**
 * Stackra file contract:
 * Purpose: `registerSegmentSubjects`, how a service lets segments cover its models: each row names a model's locked key,
 *          the model class and the `SegmentSubject` class that lists its records and computes their facts; the model's
 *          committed row changes then reach `SubjectChangeService` through the outbox, which recomputes that subject's
 *          membership.
 * Boundary: writes the internal `SEGMENT_SUBJECTS` and the outbox's change-consumer registry after checking each row;
 *           registering a row again changes nothing. One model has one key and one key one subject class, because a
 *           stored change names its model by class name and a stored segment its subject by key.
 * Runtime: node
 * Governing contract: ADR 0332 (decisions 1 and 3); ADR 0221 (decision 5: row changes through the outbox); ADR 0294
 *                     (decisions 20 and 22).
 */
import type { AnyClass } from "@stackra/container";
import { registerChangeConsumers } from "@stackra/outbox";

import type { SegmentSubject } from "#contracts/index";
import { SEGMENT_SUBJECTS } from "#node/constants/segment-subjects.constant";
import { SubjectChangeService } from "#node/services/subject-change.service";

/** A model key: a module key, a dot, a snake_case model name (`commerce.customer`). */
const MODEL_KEY = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/**
 * Registers the subject models segments may cover.
 *
 * @throws TypeError when a key is not a model key, or a key or a model is already registered with another class.
 * @example
 * registerSegmentSubjects([{ key: "commerce.customer", model: Customer, type: CustomerSegmentSubject }]);
 */
export function registerSegmentSubjects(
  rows: readonly {
    readonly key: string;
    readonly model: AnyClass;
    readonly type: AnyClass<SegmentSubject>;
  }[],
): void {
  for (const { key, model, type } of rows) {
    if (!MODEL_KEY.test(key))
      throw new TypeError(
        `registerSegmentSubjects: "${key}" is not a model key such as "commerce.customer"`,
      );
    const held = SEGMENT_SUBJECTS.get(key);
    if (held !== undefined && (held.model !== model || held.type !== type))
      throw new TypeError(
        `registerSegmentSubjects: the subject ${key} is already registered with ${held.type.name}`,
      );
    for (const [other, entry] of SEGMENT_SUBJECTS)
      if (other !== key && entry.model.name === model.name)
        throw new TypeError(
          `registerSegmentSubjects: the model ${model.name} is already the subject ${other}`,
        );
    SEGMENT_SUBJECTS.set(key, { model, type });
  }
  registerChangeConsumers(rows.map(({ model }) => [model, SubjectChangeService] as const));
}
