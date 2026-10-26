/**
 * Stackra file contract:
 * Purpose: unit tests of `ConditionFieldService`: `sync` replaces a model's rows from published fact sources and
 *          refuses a snake_case field before writing; `rulesOf` builds the model's `Rules` a source per registered
 *          source, null without rows; `check` checks a tree against those fields, refuses an unregistered model
 *          (`model_unregistered`) and checks only the shape for a null model.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0331 (decisions 2, 4 and 11); STA-817 and STA-1250.
 */
import { Database, registerModelPartners } from "@stackra/database";
import { isRefusal } from "@stackra/errors";
import type { I18nKey } from "@stackra/i18n";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { FieldType, Operator } from "#contracts/index";
import { ConditionInvalidError } from "#core/index";
import { ConditionField } from "#node/models/condition-field.model";
import { ConditionFieldService } from "#node/services/condition-field.service";

registerModelPartners([[ConditionFieldService, ConditionField]]);

/** The orders service's published record source. */
const RECORD = {
  key: "record",
  fields: {
    channelId: { type: FieldType.String, label: "orders::fields.channel" as I18nKey },
    status: {
      type: FieldType.Enum,
      label: "orders::fields.status" as I18nKey,
      values: { paid: "orders::statuses.paid" as I18nKey },
    },
  },
};

/** A stored row. */
const rowOf = (field: string, data: Partial<ConditionField>) =>
  Object.assign(new ConditionField(), {
    model: "orders.order",
    source: "record",
    field,
    values: null,
    ...data,
  });

/** The rows the orders model holds. */
const ROWS = [
  rowOf("channelId", { type: FieldType.String, label: "orders::fields.channel" as I18nKey }),
  rowOf("status", {
    type: FieldType.Enum,
    label: "orders::fields.status" as I18nKey,
    values: { paid: "orders::statuses.paid" as I18nKey },
  }),
];

/** Connects a recording entity manager holding `rows`. */
function connect(rows: ConditionField[]) {
  const em = {
    find: vi.fn(async (_model: unknown, _where: unknown, _options?: unknown) => rows),
    nativeDelete: vi.fn(async () => rows.length),
    create: vi.fn((Row: new () => object, data: object) => Object.assign(new Row(), data)),
    flush: vi.fn(async () => undefined),
    transactional: vi.fn(async (work: (manager: unknown) => Promise<unknown>) => work(em)),
  };
  vi.spyOn(Database, "current").mockReturnValue({
    em: () => em as unknown as ReturnType<Database["em"]>,
  } as unknown as Database);
  return em;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe(ConditionFieldService, () => {
  it("replaces a model's rows from its published sources", async () => {
    const em = connect([]);
    expect(await new ConditionFieldService().sync("orders.order", [RECORD])).toBe(2);
    expect(em.nativeDelete).toHaveBeenCalledTimes(1);
    expect(em.create).toHaveBeenCalledWith(ConditionField, {
      model: "orders.order",
      source: "record",
      field: "channelId",
      type: FieldType.String,
      label: "orders::fields.channel",
      values: null,
    });
    expect(em.create).toHaveBeenCalledWith(
      ConditionField,
      expect.objectContaining({ field: "status", values: { paid: "orders::statuses.paid" } }),
    );
  });

  it("refuses a snake_case field before writing anything", async () => {
    const em = connect([]);
    const snake = { key: "record", fields: { channel_id: RECORD.fields.channelId } };
    await expect(new ConditionFieldService().sync("orders.order", [snake])).rejects.toThrow();
    await expect(new ConditionFieldService().sync("orders.order", [])).rejects.toThrow();
    expect(em.nativeDelete).not.toHaveBeenCalled();
    expect(em.create).not.toHaveBeenCalled();
  });

  it("builds the model's Rules from its rows, null without any", async () => {
    connect(ROWS);
    const rules = await new ConditionFieldService().rulesOf("orders.order");
    expect(rules?.key).toBe("orders.order");
    expect(rules?.fields().map((field) => field.path)).toEqual([
      "record.channelId",
      "record.status",
    ]);
    connect([]);
    expect(await new ConditionFieldService().rulesOf("orders.order")).toBeNull();
  });

  it("checks a condition against the registered fields", async () => {
    connect(ROWS);
    const service = new ConditionFieldService();
    const paid = { field: "record.status", operator: Operator.Equals, value: "paid" };
    expect(await service.check("orders.order", paid)).toEqual(paid);
    const snake = await service
      .check("orders.order", {
        field: "record.channel_id",
        operator: Operator.Equals,
        value: "web",
      })
      .catch((error: unknown) => error);
    expect(isRefusal(snake, ConditionInvalidError)).toBe(true);
    expect((snake as ConditionInvalidError).fieldErrors).toEqual({ "(root)": "field_unknown" });
  });

  it("refuses every condition on an unregistered model, and checks only the shape without a model", async () => {
    connect([]);
    const service = new ConditionFieldService();
    const unregistered = await service
      .check("orders.order", { all: [] })
      .catch((error: unknown) => error);
    expect((unregistered as ConditionInvalidError).fieldErrors).toEqual({
      "(root)": "model_unregistered",
    });
    const anyField = { field: "record.anything", operator: Operator.IsSet };
    expect(await service.check(null, anyField)).toEqual(anyField);
    const malformed = await service.check(null, { some: [] }).catch((error: unknown) => error);
    expect(isRefusal(malformed, ConditionInvalidError)).toBe(true);
  });
});
