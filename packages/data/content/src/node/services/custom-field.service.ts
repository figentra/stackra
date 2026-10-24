/**
 * Stackra file contract:
 * Purpose: `CustomFieldService`, the module service over `CustomField`: defines a field for a model in a scope, lists a
 *          model's definitions in a scope, and writes and reads a record's values checked against them.
 * Boundary: a `CrudService<CustomField>` that injects `Repository<CustomFieldValueSet>`, so every read and write runs in
 *           the caller's transaction and scope session; row-level security limits both tables to the session's
 *           granted subtrees, and a scope outside them is refused by the database. Selecting `scopeId` picks the node
 *           whose definitions apply; it is not the isolation. A definition is checked by
 *           `checkCustomFieldDefinition` and values by `checkCustomFields`; a write flushes with the caller's unit of
 *           work. The plan limit on definitions is `CustomFieldLimitEntitlement`, gated by the calling action.
 * Runtime: node
 * Governing contract: ADR 0116 (decision CT2); ADR 0327 (decisions 3, 6 and 9); ADR 0105 as amended by ADR 0294;
 *                     ADR 0154.
 */
import type { ScopeRef } from "@stackra/contracts";
import { CrudService, type Repository, UniqueViolation } from "@stackra/database";
import { Translated } from "@stackra/model";

import {
  checkCustomFieldDefinition,
  checkCustomFields,
  type CustomFieldDefinition,
  CustomFieldDefinitionInvalidError,
  CustomFieldTakenError,
  type CustomFieldValue,
} from "#core/index";
import type { CustomField } from "#node/models/custom-field.model";
import type { CustomFieldValueSet } from "#node/models/custom-field-value-set.model";

/** A model key: the module key, a dot, the model's snake_case key (`catalogue.product`). */
const MODEL_KEY = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/** The definition a stored row holds. */
function definitionOf(row: CustomField): CustomFieldDefinition {
  return {
    key: row.key,
    type: row.type,
    label: row.label.values,
    required: row.required,
    ...row.rules,
  };
}

/**
 * Defines custom fields and stores their values.
 *
 * @example
 * await fields.define(scope, "catalogue.product", { key: "giftWrap", type: CustomFieldType.Boolean, label, required: false });
 * await fields.write(scope, "catalogue.product", product.id, { giftWrap: true });
 * await fields.read("catalogue.product", product.id); // { giftWrap: true }
 */
export class CustomFieldService extends CrudService<CustomField> {
  /** The side table of values. */
  private readonly valueSets: Repository<CustomFieldValueSet>;

  /** @param valueSets - the side table of values, one row per record. */
  constructor(valueSets: Repository<CustomFieldValueSet>) {
    super();
    this.valueSets = valueSets;
  }

  /**
   * Stores `definition` as a field of `model` at `scope`.
   *
   * @throws CustomFieldDefinitionInvalidError when `model` is not a model key or `definition` is not a strict
   *         definition of a registered type.
   * @throws CustomFieldTakenError when the model already has the key in the scope.
   */
  async define(scope: ScopeRef, model: string, definition: unknown): Promise<CustomField> {
    if (!MODEL_KEY.test(model))
      throw CustomFieldDefinitionInvalidError.create(
        {},
        { fieldErrors: { model: "invalid_format" } },
      );
    const { key, type, label, required, ...rules } = checkCustomFieldDefinition(definition);
    try {
      return await this.insert({
        scopeId: scope.id,
        scopePath: scope.path,
        model,
        key,
        type,
        label: Translated.of(label),
        required,
        rules,
      });
    } catch (error) {
      if (error instanceof UniqueViolation) throw CustomFieldTakenError.create({ model, key });
      throw error;
    }
  }

  /** The definitions of `model` at `scope`, in the order they were defined. */
  async definitionsOf(scope: ScopeRef, model: string): Promise<CustomFieldDefinition[]> {
    const rows = await this.find(
      { scopeId: scope.id, model },
      { orderBy: { createdAt: "asc", id: "asc" } },
    );
    return rows.map(definitionOf);
  }

  /**
   * Replaces the custom values of the record `recordId` of `model` at `scope` with `values`. The caller passes the id
   * of a record it has loaded in the same session; a record id another scope holds values for fails on the unique
   * index when the unit of work flushes.
   *
   * @returns the values stored.
   * @throws CustomFieldsInvalidError when `values` break the model's definitions at `scope`.
   */
  async write(
    scope: ScopeRef,
    model: string,
    recordId: string,
    values: unknown,
  ): Promise<Readonly<Record<string, CustomFieldValue>>> {
    const checked = checkCustomFields(await this.definitionsOf(scope, model), values);
    const row = await this.valueSets.findOne({ model, recordId });
    if (row === null)
      this.valueSets.create({
        scopeId: scope.id,
        scopePath: scope.path,
        model,
        recordId,
        values: checked,
      });
    else row.values = checked;
    return checked;
  }

  /** The stored custom values of the record `recordId` of `model`; `{}` when none were written. */
  async read(model: string, recordId: string): Promise<Readonly<Record<string, CustomFieldValue>>> {
    const row = await this.valueSets.findOne({ model, recordId });
    return row?.values ?? {};
  }
}
