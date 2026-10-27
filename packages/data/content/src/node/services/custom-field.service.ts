/**
 * Stackra file contract:
 * Purpose: `CustomFieldService`, the module service over `CustomField`: defines a field for a target in a scope, lists
 *          a target's definitions in a scope, and writes and reads a record's values checked against them. A target is
 *          a model key, or a model key and a runtime subtype (a content type key), so types defined at runtime each
 *          carry their own fields. The scope is the explicit `ScopeRef` argument when given, else the running call's
 *          scope (`ctx.scope`).
 * Boundary: a `CrudService<CustomField>` that injects `Repository<CustomFieldValueSet>`, so every read and write runs in
 *           the caller's transaction and scope session; row-level security limits both tables to the session's
 *           granted subtrees, and a scope outside them is refused by the database. Selecting `scopeId` picks the node
 *           whose definitions apply; it is not the isolation. A definition is checked by
 *           `checkCustomFieldDefinition` and values by `checkCustomFields`; a write flushes with the caller's unit of
 *           work. The plan limit on definitions is `CustomFieldLimitEntitlement`, gated by the calling action.
 *           Without an explicit scope the call's comes from `RequestContext`, which throws outside a call; a call with
 *           no scope (a platform call) is refused with a `TypeError`, since a definition always belongs to a node. A
 *           record's values are one row whatever its subtype: the caller passes the record's current target on write.
 * Runtime: node
 * Governing contract: ADR 0116 (decision CT2) as amended by ADR 0226; ADR 0327 (decisions 3, 6 and 9); ADR 0105 as
 *                     amended by ADR 0294; ADR 0154.
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
  type CustomFieldTarget,
  CustomFieldTakenError,
  type CustomFieldValue,
} from "#core/index";
import type { CustomField } from "#node/models/custom-field.model";
import type { CustomFieldValueSet } from "#node/models/custom-field-value-set.model";

/** A model key: the module key, a dot, the model's snake_case key (`catalogue.product`). */
const MODEL_KEY = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/** A subtype key: snake_case, as a content type key is (`blog_post`). */
const SUBTYPE_KEY = /^[a-z][a-z0-9_]{0,62}$/;

/**
 * The model key and subtype (`''` for the whole model) of `target`.
 *
 * @throws CustomFieldDefinitionInvalidError when either key is malformed.
 */
function targetOf(target: CustomFieldTarget): { model: string; subtype: string } {
  const { model, subtype = "" } = typeof target === "string" ? { model: target } : target;
  if (!MODEL_KEY.test(model))
    throw CustomFieldDefinitionInvalidError.create(
      {},
      { fieldErrors: { model: "invalid_format" } },
    );
  if (subtype !== "" && !SUBTYPE_KEY.test(subtype))
    throw CustomFieldDefinitionInvalidError.create(
      {},
      { fieldErrors: { subtype: "invalid_format" } },
    );
  return { model, subtype };
}

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
 * await fields.define({ model: "entries.entry", subtype: "recipe" }, { key: "servings", type: CustomFieldType.Number, label, required: true });
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
   * Stores `definition` as a field of `target` at `scope` (the call's scope when left out).
   *
   * @throws CustomFieldDefinitionInvalidError when `target` names a malformed model or subtype key, or `definition` is
   *         not a strict definition of a registered type.
   * @throws CustomFieldTakenError when the target already has the key in the scope.
   * @throws TypeError when no scope is passed and the call has none.
   */
  async define(
    ...args:
      | [target: CustomFieldTarget, definition: unknown]
      | [scope: ScopeRef, target: CustomFieldTarget, definition: unknown]
  ): Promise<CustomField> {
    const [scope, target, definition]: [ScopeRef, CustomFieldTarget, unknown] =
      args.length === 2 ? [this.callScope(), ...args] : args;
    const { model, subtype } = targetOf(target);
    const { key, type, label, required, ...rules } = checkCustomFieldDefinition(definition);
    try {
      return await this.insert({
        scopeId: scope.id,
        scopePath: scope.path,
        model,
        subtype,
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
   * The definitions of `target` at `scope` (the call's scope when left out), in the order they were defined. A
   * subtype's definitions are its own: the whole model's are not merged in.
   *
   * @throws CustomFieldDefinitionInvalidError when `target` names a malformed model or subtype key.
   * @throws TypeError when no scope is passed and the call has none.
   */
  async definitionsOf(
    ...args: [target: CustomFieldTarget] | [scope: ScopeRef, target: CustomFieldTarget]
  ): Promise<CustomFieldDefinition[]> {
    const [scope, target]: [ScopeRef, CustomFieldTarget] =
      args.length === 1 ? [this.callScope(), ...args] : args;
    const { model, subtype } = targetOf(target);
    const rows = await this.find(
      { scopeId: scope.id, model, subtype },
      { orderBy: { createdAt: "asc", id: "asc" } },
    );
    return rows.map(definitionOf);
  }

  /**
   * Replaces the custom values of the record `recordId` of `target` at `scope` (the call's scope when left out) with
   * `values`, checked against that target's definitions (a subtype's for a record of a runtime type). The caller passes the id of a record it has loaded in the same session; a record id another scope holds
   * values for fails on the unique index when the unit of work flushes.
   *
   * @returns the values stored.
   * @throws CustomFieldsInvalidError when `values` break the target's definitions at `scope`.
   * @throws CustomFieldDefinitionInvalidError when `target` names a malformed model or subtype key.
   * @throws TypeError when no scope is passed and the call has none.
   */
  async write(
    ...args:
      | [target: CustomFieldTarget, recordId: string, values: unknown]
      | [scope: ScopeRef, target: CustomFieldTarget, recordId: string, values: unknown]
  ): Promise<Readonly<Record<string, CustomFieldValue>>> {
    const [scope, target, recordId, values]: [ScopeRef, CustomFieldTarget, string, unknown] =
      args.length === 3 ? [this.callScope(), ...args] : args;
    const { model } = targetOf(target);
    const checked = checkCustomFields(await this.definitionsOf(scope, target), values);
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
