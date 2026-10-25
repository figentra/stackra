/**
 * Stackra file contract:
 * Purpose: `CustomFieldService`, the module service over `CustomField`: defines a field for a model in a scope, lists a
 *          model's definitions in a scope, and writes and reads a record's values checked against them. The scope is
 *          the explicit `ScopeRef` argument when given, else the running call's scope (`ctx.scope`).
 * Boundary: a `CrudService<CustomField>` that injects `Repository<CustomFieldValueSet>`, so every read and write runs in
 *           the caller's transaction and scope session; row-level security limits both tables to the session's
 *           granted subtrees, and a scope outside them is refused by the database. Selecting `scopeId` picks the node
 *           whose definitions apply; it is not the isolation. A definition is checked by
 *           `checkCustomFieldDefinition` and values by `checkCustomFields`; a write flushes with the caller's unit of
 *           work. The plan limit on definitions is `CustomFieldLimitEntitlement`, gated by the calling action.
 *           Without an explicit scope the call's comes from `RequestContext`, which throws outside a call; a call with
 *           no scope (a platform call) is refused with a `TypeError`, since a definition always belongs to a node.
 * Runtime: node
 * Governing contract: ADR 0116 (decision CT2); ADR 0327 (decisions 3, 6 and 9); ADR 0105 as amended by ADR 0294;
 *                     ADR 0154.
 */
import type { RequestContext } from "@stackra/actions";
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
 * await fields.write("catalogue.product", product.id, { giftWrap: true }); // in the call's scope
 * await fields.read("catalogue.product", product.id); // { giftWrap: true }
 */
export class CustomFieldService extends CrudService<CustomField> {
  /** The side table of values. */
  private readonly valueSets: Repository<CustomFieldValueSet>;

  /** The running call, whose scope applies when none is passed. */
  private readonly request: RequestContext;

  /**
   * @param valueSets - the side table of values, one row per record.
   * @param request - the running call's context.
   */
  constructor(valueSets: Repository<CustomFieldValueSet>, request: RequestContext) {
    super();
    this.valueSets = valueSets;
    this.request = request;
  }

  /**
   * Stores `definition` as a field of `model` at `scope` (the call's scope when left out).
   *
   * @throws CustomFieldDefinitionInvalidError when `model` is not a model key or `definition` is not a strict
   *         definition of a registered type.
   * @throws CustomFieldTakenError when the model already has the key in the scope.
   * @throws TypeError when no scope is passed and the call has none.
   */
  async define(
    ...args:
      | [model: string, definition: unknown]
      | [scope: ScopeRef, model: string, definition: unknown]
  ): Promise<CustomField> {
    const [scope, model, definition]: [ScopeRef, string, unknown] =
      args.length === 2 ? [this.callScope(), ...args] : args;
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

  /**
   * The definitions of `model` at `scope` (the call's scope when left out), in the order they were defined.
   *
   * @throws TypeError when no scope is passed and the call has none.
   */
  async definitionsOf(
    ...args: [model: string] | [scope: ScopeRef, model: string]
  ): Promise<CustomFieldDefinition[]> {
    const [scope, model]: [ScopeRef, string] =
      args.length === 1 ? [this.callScope(), ...args] : args;
    const rows = await this.find(
      { scopeId: scope.id, model },
      { orderBy: { createdAt: "asc", id: "asc" } },
    );
    return rows.map(definitionOf);
  }

  /**
   * Replaces the custom values of the record `recordId` of `model` at `scope` (the call's scope when left out) with
   * `values`. The caller passes the id of a record it has loaded in the same session; a record id another scope holds
   * values for fails on the unique index when the unit of work flushes.
   *
   * @returns the values stored.
   * @throws CustomFieldsInvalidError when `values` break the model's definitions at `scope`.
   * @throws TypeError when no scope is passed and the call has none.
   */
  async write(
    ...args:
      | [model: string, recordId: string, values: unknown]
      | [scope: ScopeRef, model: string, recordId: string, values: unknown]
  ): Promise<Readonly<Record<string, CustomFieldValue>>> {
    const [scope, model, recordId, values]: [ScopeRef, string, string, unknown] =
      args.length === 3 ? [this.callScope(), ...args] : args;
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

  /**
   * The running call's scope.
   *
   * @throws TypeError when the call has none (a platform call); Error outside every call.
   */
  private callScope(): ScopeRef {
    const { scope } = this.request.current();
    if (scope === undefined)
      throw new TypeError("CustomFieldService: the call has no scope, so pass a ScopeRef");
    return scope;
  }
}
