/**
 * Stackra file contract:
 * Purpose: `ValidateOnFlushSubscriber`, the ORM subscriber that checks each created or changed row of a
 *          `ValidateOnFlush` model against the model's generated schema before the flush writes it, and refuses the
 *          flush with `ModelInvalidError` when the schema rejects the row.
 * Boundary: passed as one of `DatabaseOptions.subscribers` (the generated boot adds it when a model has the trait).
 *           The row holds decoded values (a `Date`, `Money`, a link), so it is checked by encoding it through the
 *           schema (`safeEncodeAsync`), which runs the same rules a decode does without parsing wire input. Only the
 *           schema's own keys are read; a removal is not checked. A model with the trait and no registered schema is a
 *           setup mistake: `schemaOf` throws. Native statements fire no entity event and are not checked.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 26); ADR 0096 (decision 4: traits run as ORM subscribers); data-layer gap mo21
 *                     (stackra-287).
 */
import type { EventArgs, EventSubscriber } from "@mikro-orm/core";
import { traitsOf } from "@stackra/model";
import { schemaOf } from "@stackra/validation";

import { ModelInvalidError } from "#core/errors/model-invalid.error";

/** Whether `model` opted in with `ValidateOnFlush`. */
function validates(model: object): boolean {
  return traitsOf(model).some((trait) => trait.name === "validate_on_flush");
}

/**
 * Checks opted-in rows against their schema at flush.
 *
 * @example
 * const database = await PostgresDatabaseDriver.connect({ url, subscribers: [new ValidateOnFlushSubscriber()] });
 */
export class ValidateOnFlushSubscriber implements EventSubscriber<object> {
  /**
   * The ORM's `beforeCreate`.
   *
   * @throws ModelInvalidError when the schema rejects the new row.
   * @throws TypeError when the model has no registered schema.
   */
  async beforeCreate(args: EventArgs<object>): Promise<void> {
    await this.check(args);
  }

  /**
   * The ORM's `beforeUpdate`.
   *
   * @throws ModelInvalidError when the schema rejects the changed row.
   * @throws TypeError when the model has no registered schema.
   */
  async beforeUpdate(args: EventArgs<object>): Promise<void> {
    await this.check(args);
  }

  /** Encodes the row through its model's schema and refuses it on any issue. */
  private async check({ entity, meta }: EventArgs<object>): Promise<void> {
    const model = meta.class;
    if (!validates(model)) return;
    const result = await schemaOf(model).safeEncodeAsync({ ...entity } as never);
    if (result.success) return;
    throw ModelInvalidError.create({
      model: meta.className,
      issues: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    });
  }
}
