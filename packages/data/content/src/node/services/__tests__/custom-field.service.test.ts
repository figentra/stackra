/**
 * Stackra file contract:
 * Purpose: unit tests of `CustomFieldService`: `define` stores a checked definition in the scope with a translated
 *          label, refuses a bad model key or definition, and turns a unique violation into `custom_field_taken`;
 *          `definitionsOf` reads the scope's definitions in order and maps them back; `write` checks values against
 *          them and creates or changes the record's one row; `read` returns the stored values or `{}`.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0116 (decision CT2); ADR 0327 (decisions 3 and 9).
 */
import type { ScopeRef } from "@stackra/contracts";
import { CrudService, Database, registerModelPartners, UniqueViolation } from "@stackra/database";
import { isRefusal } from "@stackra/errors";
import { Translated } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import {
  CustomFieldDefinitionInvalidError,
  CustomFieldsInvalidError,
  CustomFieldTakenError,
  CustomFieldType,
} from "#core/index";
import { CustomField } from "#node/models/custom-field.model";
import { CustomFieldValueSet } from "#node/models/custom-field-value-set.model";
import { CustomFieldService } from "#node/services/custom-field.service";

/** The side table's repository, as `repositoryOf(CustomFieldValueSet)` makes it, without its abstract type. */
class ValueSetRepository extends CrudService<CustomFieldValueSet> {}

registerModelPartners([
  [CustomFieldService, CustomField],
  [ValueSetRepository, CustomFieldValueSet],
]);

/** The scope every call runs in. */
const SCOPE: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };

/** The model the fields extend. */
const PRODUCT = "catalogue.product";

/** A valid boolean definition. */
const GIFT_WRAP = {
  key: "giftWrap",
  type: CustomFieldType.Boolean,
  label: { en: "Gift wrap", ar: "تغليف هدية" },
  required: true,
};

/** A stored definition row. */
function storedField(): CustomField {
  return Object.assign(new CustomField(), {
    ...GIFT_WRAP,
    scopeId: SCOPE.id,
    scopePath: SCOPE.path,
    model: PRODUCT,
    label: Translated.of(GIFT_WRAP.label),
  });
}

/** Connects a recording entity manager whose reads answer `fields` and `valueSet`. */
function connect(fields: CustomField[] = [], valueSet: CustomFieldValueSet | null = null) {
  const em = {
    find: vi.fn(async (_model: unknown, _where: unknown, _options?: unknown) => fields),
    findOne: vi.fn(async (_model: unknown, _where: unknown) => valueSet),
    create: vi.fn((Row: new () => object, data: object) => Object.assign(new Row(), data)),
    flush: vi.fn(async () => undefined),
    transactional: vi.fn(async (work: (manager: unknown) => Promise<unknown>) => work(em)),
  };
  vi.spyOn(Database, "current").mockReturnValue({
    em: () => em as unknown as ReturnType<Database["em"]>,
  } as unknown as Database);
  return em;
}

/** The service with the value side table's repository. */
const serviceOf = () => new CustomFieldService(new ValueSetRepository());

afterEach(() => {
  vi.restoreAllMocks();
});

describe(CustomFieldService, () => {
  it("defines a checked field in the scope with a translated label", async () => {
    const em = connect();
    const field = await serviceOf().define(SCOPE, PRODUCT, GIFT_WRAP);
    expect(field).toMatchObject({
      scopeId: SCOPE.id,
      scopePath: SCOPE.path,
      model: PRODUCT,
      key: "giftWrap",
      type: "boolean",
      required: true,
      rules: {},
    });
    expect(field.label).toBeInstanceOf(Translated);
    expect(field.label.in("ar")).toBe("تغليف هدية");
    expect(field.id).toMatch(/^cfd_/);
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

  it("keeps a select's choices and bounds in its rules", async () => {
    connect();
    const choices = [{ value: "s", label: { en: "Small" } }];
    const sizes = {
      key: "sizes",
      type: CustomFieldType.MultiSelect,
      label: { en: "Sizes" },
      required: false,
      choices,
      max: 1,
    };
    const field = await serviceOf().define(SCOPE, PRODUCT, sizes);
    expect(field.rules).toEqual({ choices, max: 1 });
  });

  it("refuses a bad model key and a definition that is not strict data", async () => {
    connect();
    const badModel = await serviceOf()
      .define(SCOPE, "Product", GIFT_WRAP)
      .catch((error: unknown) => error);
    expect(isRefusal(badModel, CustomFieldDefinitionInvalidError)).toBe(true);
    expect((badModel as CustomFieldDefinitionInvalidError).fieldErrors).toEqual({
      model: "invalid_format",
    });
    const extra = await serviceOf()
      .define(SCOPE, PRODUCT, { ...GIFT_WRAP, onChange: "alert(1)" })
      .catch((error: unknown) => error);
    expect(isRefusal(extra, CustomFieldDefinitionInvalidError)).toBe(true);
  });

  it("refuses a key the model already has in the scope", async () => {
    const em = connect();
    em.flush.mockRejectedValueOnce(new UniqueViolation(new Error("duplicate key")));
    const taken = await serviceOf()
      .define(SCOPE, PRODUCT, GIFT_WRAP)
      .catch((error: unknown) => error);
    expect(isRefusal(taken, CustomFieldTakenError)).toBe(true);
    expect((taken as CustomFieldTakenError).details).toEqual({ model: PRODUCT, key: "giftWrap" });
  });

  it("reads the scope's definitions in order and maps them back", async () => {
    const em = connect([storedField()]);
    expect(await serviceOf().definitionsOf(SCOPE, PRODUCT)).toEqual([GIFT_WRAP]);
    expect(em.find.mock.calls[0]?.[0]).toBe(CustomField);
    expect(em.find.mock.calls[0]?.[1]).toEqual({ scopeId: SCOPE.id, model: PRODUCT });
    expect(em.find.mock.calls[0]?.[2]).toEqual({ orderBy: { createdAt: "asc", id: "asc" } });
  });

  it("creates the record's row on its first write", async () => {
    const em = connect([storedField()]);
    const recordId = "prd_01j9z3k4m5n6p7q8r9s0t1v2w3";
    expect(await serviceOf().write(SCOPE, PRODUCT, recordId, { giftWrap: true })).toEqual({
      giftWrap: true,
    });
    expect(em.findOne.mock.calls[0]?.[1]).toEqual({ model: PRODUCT, recordId });
    expect(em.create).toHaveBeenCalledWith(CustomFieldValueSet, {
      scopeId: SCOPE.id,
      scopePath: SCOPE.path,
      model: PRODUCT,
      recordId,
      values: { giftWrap: true },
    });
  });

  it("changes the record's row on a later write", async () => {
    const stored = Object.assign(new CustomFieldValueSet(), { values: { giftWrap: true } });
    const em = connect([storedField()], stored);
    await serviceOf().write(SCOPE, PRODUCT, "prd_01j9z3k4m5n6p7q8r9s0t1v2w3", { giftWrap: false });
    expect(stored.values).toEqual({ giftWrap: false });
    expect(em.create).not.toHaveBeenCalled();
  });

  it("refuses values the definitions do not accept", async () => {
    connect([storedField()]);
    const refused = await serviceOf()
      .write(SCOPE, PRODUCT, "prd_01j9z3k4m5n6p7q8r9s0t1v2w3", { giftWrap: "yes" })
      .catch((error: unknown) => error);
    expect(isRefusal(refused, CustomFieldsInvalidError)).toBe(true);
    expect((refused as CustomFieldsInvalidError).fieldErrors).toEqual({ giftWrap: "invalid_type" });
  });

  it("reads the stored values, or nothing for a record never written", async () => {
    connect([], Object.assign(new CustomFieldValueSet(), { values: { giftWrap: true } }));
    expect(await serviceOf().read(PRODUCT, "prd_01j9z3k4m5n6p7q8r9s0t1v2w3")).toEqual({
      giftWrap: true,
    });
    connect();
    expect(await serviceOf().read(PRODUCT, "prd_01j9z3k4m5n6p7q8r9s0t1v2w4")).toEqual({});
  });
});
