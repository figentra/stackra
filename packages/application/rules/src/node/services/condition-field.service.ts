/**
 * Stackra file contract:
 * Purpose: `ConditionFieldService`, the cross-service condition-field registry: the service that owns a model
 *          replaces the fields a stored condition may test on it (`sync`, from its published `FactSource$`
 *          documents), and the service that stores conditions (Access) builds that model's `Rules` (`rulesOf`) and
 *          checks a tenant's tree against it at write time (`check`).
 * Boundary: a `CrudService<ConditionField>` over the platform table `rules.condition_fields`, run in the caller's unit
 *           of work. A sync is all or nothing for one model: every source is parsed with `FactSource$` and held to
 *           `Rules.create` (camelCase keys, enum values) before a row is written, then the model's rows are replaced.
 *           A model with no registered field refuses every condition (fail closed, `model_unregistered`); a null model
 *           (a wildcard permission naming no one model) checks the shape only, with `Condition$`.
 *           Conditions already stored are not rechecked here: `evaluate` checks again before it runs. Who may call
 *           `sync` is the host action's permission; this holds no tenant data.
 * Runtime: node
 * Governing contract: ADR 0331 (decisions 2, 3, 4, 10 and 11); ADR 0140 (field errors by path); STA-817 and STA-1250
 *                     (the registry Access kept as `policies.condition_field`, now shared).
 */
import { CrudService } from "@stackra/database";
import { z } from "zod";

import type { FactField, FactSource } from "#contracts/index";
import { type Condition, Condition$, ConditionInvalidError, FactSource$, Rules } from "#core/index";
import type { ConditionField } from "#node/models/condition-field.model";

/** What a sync takes: one to twenty published fact sources. */
const SOURCES = z.array(FactSource$).min(1).max(20);

/** A row as `@stackra/rules` reads it. */
const factOf = (row: ConditionField): FactField => ({
  type: row.type,
  label: row.label,
  ...(row.values === null ? {} : { values: row.values }),
});

/**
 * Keeps the registry.
 *
 * @example
 * await conditionFields.sync("orders.order", [{ key: "record", fields: { channelId: { type: "string", label: "orders::fields.channel" } } }]);
 * const condition = await conditionFields.check("orders.order", input.condition); // ConditionInvalidError
 */
export class ConditionFieldService extends CrudService<ConditionField> {
  /**
   * Replaces `model`'s registered fields with those of `sources`.
   *
   * @returns how many fields the model now has.
   * @throws ZodError when `sources` are not one to twenty `FactSource$` documents.
   * @throws TypeError when `model` is not a model key or the sources misdeclare a field (see `Rules.create`).
   */
  async sync(model: string, sources: unknown): Promise<number> {
    const parsed: readonly FactSource[] = SOURCES.parse(sources);
    const rules = Rules.create({ key: model, sources: parsed });
    await this.purge({ model });
    for (const { path, field } of rules.fields()) {
      const [source = "", key = ""] = path.split(".");
      // oxlint-disable-next-line no-await-in-loop -- reason: one model's few fields, in the caller's unit of work
      await this.insert({
        model,
        source,
        field: key,
        type: field.type,
        label: field.label,
        values: field.values ?? null,
      });
    }
    return rules.fields().length;
  }

  /** `model`'s registered fields as its `Rules`, a source per registered source; null when it has none. */
  async rulesOf(model: string): Promise<Rules | null> {
    const rows = await this.find({ model });
    if (rows.length === 0) return null;
    const sources = new Map<string, Record<string, FactField>>();
    for (const row of rows)
      sources.set(row.source, { ...sources.get(row.source), [row.field]: factOf(row) });
    return Rules.create({
      key: model,
      sources: [...sources].map(([key, fields]) => ({ key, fields })),
    });
  }

  /**
   * `condition` checked against `model`'s registered fields; the shape only when `model` is null.
   *
   * @throws ConditionInvalidError with one field error per refused node, or `model_unregistered` at the root when the
   *         model has no registered field.
   */
  async check(model: string | null, condition: unknown): Promise<Condition> {
    if (model === null) {
      const shaped = Condition$.safeParse(condition);
      if (shaped.success) return shaped.data;
      const fieldErrors = Object.fromEntries(
        shaped.error.issues.map((issue) => [issue.path.join(".") || "(root)", issue.message]),
      );
      throw ConditionInvalidError.create({}, { fieldErrors });
    }
    const rules = await this.rulesOf(model);
    if (rules === null)
      throw ConditionInvalidError.create({}, { fieldErrors: { "(root)": "model_unregistered" } });
    return rules.check(condition);
  }
}
