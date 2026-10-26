/**
 * Stackra file contract:
 * Purpose: `@DocumentNumber(options)`, the field decorator by which a model marks a field as a legal document number
 *          (an invoice, a receipt, a filing) taken from a gapless `Sequence` at commit.
 * Boundary: made with `createDecorator`, so it records metadata only; one per field. It may mark the model kinds only.
 *           It checks the sequence key's shape; gen checks the sequence exists (`document_number_unsequenced`) and
 *           the migration compiler refuses a Postgres `SEQUENCE`, so a document number is never a counter column or
 *           a database sequence (ADR 0342 decision 5). Allocation is `@stackra/database`'s `SequenceService`.
 * Runtime: isomorphic
 * Governing contract: ADR 0342 (decisions 1, 3 and 5; enforcement); ADR 0294 (decision 6: facets).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { AnyClass, DecoratorFunction } from "@stackra/container";

import { MODEL_KINDS } from "#core/constants/model-kinds.constant";
import type { DocumentNumberOptions } from "#core/types/document-number-options.type";

/** A sequence key: a written snake_case key, optionally after its module key (`billing.invoice`). */
const SEQUENCE = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)?$/;

/** The recording decorator. */
const DOCUMENT_NUMBER = createDecorator<DocumentNumberOptions>({
  kind: "document_number",
  target: DecoratorTarget.Field,
  kinds: MODEL_KINDS,
});

/**
 * Marks the field as a document number of `options.sequence`.
 *
 * @throws TypeError for a sequence key that is not snake_case (optionally `<module>.<key>`); at class definition, when
 *         applied to anything but a model field.
 * @example
 * ```ts
 * export class Invoice extends Model.with(HasPublicId("inv")) {
 *   @DocumentNumber({ sequence: "invoice" })
 *   number: string | null = null;
 * }
 * ```
 */
export function DocumentNumber(options: DocumentNumberOptions): DecoratorFunction {
  if (!SEQUENCE.test(options.sequence))
    throw new TypeError(
      `@DocumentNumber: "${options.sequence}" is not a sequence key such as "invoice" or "billing.invoice"`,
    );
  return DOCUMENT_NUMBER(Object.freeze({ ...options }));
}

/** The sequence of each document-number field of `type` and its ancestors. */
DocumentNumber.members = (type: AnyClass): ReadonlyMap<string | symbol, DocumentNumberOptions> =>
  DOCUMENT_NUMBER.members(type);
