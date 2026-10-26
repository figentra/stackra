/**
 * Stackra file contract:
 * Purpose: unit tests of `ImportRunner`: mapped rows validated per row with refused rows reported, batches written and
 *          recorded, a failed batch failing the run and the next call resuming after the cursor without repeating
 *          committed rows, closed runs refused, one sheet only, the whole-run revert inside and past its window and
 *          after a purge, and a workbook import feeding two targets from two sheets, resumed per sheet, refused out of
 *          order, and reverted through each sheet's target.
 * Boundary: test only. The target is an in-memory store keyed by SKU; the batch size and window are test data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decisions 6 to 8); ADR 0431 (decisions 1 and 3).
 */
import { Clock, Duration, type Json } from "@stackra/contracts";
import { Driver } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { ImportRunState } from "#contracts/enums/import-run-state.enum";
import type { ImportChange } from "#contracts/types/import-change.type";
import type { ImportTarget } from "#contracts/types/import-target.type";
import type { TabularRow } from "#contracts/types/tabular-row.type";
import { MemoryImportLedgerDriver } from "#core/drivers/memory-import-ledger.driver";
import { ImportRunClosedError } from "#core/errors/import-run-closed.error";
import { ImportRunNotFoundError } from "#core/errors/import-run-not-found.error";
import { ImportUndoExpiredError } from "#core/errors/import-undo-expired.error";
import { ImportRunner } from "#core/services/import-runner.service";

const SCHEMA = z.object({ sku: z.string(), price: z.coerce.number().positive() });
type Product = z.infer<typeof SCHEMA>;

class FixedClock extends Driver(Clock) {
  at = new Date("2026-10-25T00:00:00.000Z");

  now(): Date {
    return new Date(this.at);
  }
}

class ProductStore implements ImportTarget<Product> {
  readonly schema = SCHEMA;

  readonly products = new Map<string, Product>();

  failOn?: string;

  upserted: string[] = [];

  async upsert(records: readonly Product[]): Promise<readonly ImportChange[]> {
    if (records.some((record) => record.sku === this.failOn)) throw new Error("batch failed");
    return records.map((record) => {
      const before = this.products.get(record.sku);
      this.products.set(record.sku, record);
      this.upserted.push(record.sku);
      return { key: record.sku, before: before === undefined ? null : ({ ...before } as Json) };
    });
  }

  async revert(changes: readonly ImportChange[]): Promise<void> {
    for (const change of changes)
      if (change.before === null) this.products.delete(change.key);
      else this.products.set(change.key, change.before as unknown as Product);
  }
}

async function* sheet(cells: string[][], name = ""): AsyncGenerator<TabularRow> {
  for (const [index, row] of cells.entries()) yield { sheet: name, row: index + 1, cells: row };
}

const FILE = [
  ["رمز المنتج", "السعر"],
  ["a", "5"],
  ["b", "x"],
  ["c", "7"],
  ["d", "9"],
];
const MAPPING = { sku: "رمز المنتج", price: "السعر" };

function setup() {
  const ledger = new MemoryImportLedgerDriver();
  const clock = new FixedClock();
  return { ledger, clock, runner: new ImportRunner(ledger, clock), store: new ProductStore() };
}

describe("ImportRunner", () => {
  it("imports valid rows in batches and reports refused rows", async () => {
    const { runner, store, ledger } = setup();
    store.products.set("c", { sku: "c", price: 1 });
    const report = await runner.run({
      runId: "imp_1",
      rows: sheet(FILE),
      mapping: MAPPING,
      target: store,
      batchSize: 2,
    });
    expect(report.written).toBe(3);
    expect(report.errors).toEqual([
      { sheet: "", row: 3, issues: [expect.objectContaining({ field: "price" })] },
    ]);
    expect([...store.products.values()]).toEqual([
      { sku: "c", price: 7 },
      { sku: "a", price: 5 },
      { sku: "d", price: 9 },
    ]);
    expect((await ledger.batches("imp_1")).map((batch) => batch.lastRow)).toEqual([3, 5]);
    expect((await ledger.find("imp_1"))?.state).toBe(ImportRunState.Finished);
    await expect(
      runner.run({
        runId: "imp_1",
        rows: sheet(FILE),
        mapping: MAPPING,
        target: store,
        batchSize: 2,
      }),
    ).rejects.toThrow(ImportRunClosedError);
  });

  it("fails a run on a failed batch and resumes after its cursor", async () => {
    const { runner, store, ledger } = setup();
    store.failOn = "c";
    const options = { runId: "imp_2", mapping: MAPPING, target: store, batchSize: 2 };
    await expect(runner.run({ ...options, rows: sheet(FILE) })).rejects.toThrow("batch failed");
    expect(await ledger.find("imp_2")).toMatchObject({ state: ImportRunState.Failed, cursor: 3 });
    store.failOn = undefined;
    const report = await runner.run({ ...options, rows: sheet(FILE) });
    expect(store.upserted).toEqual(["a", "c", "d"]);
    expect(report.written).toBe(3);
    expect(report.errors).toHaveLength(1);
  });

  it("refuses a bad batch size and a second sheet", async () => {
    const { runner, store } = setup();
    await expect(
      runner.run({
        runId: "imp_3",
        rows: sheet(FILE),
        mapping: MAPPING,
        target: store,
        batchSize: 0,
      }),
    ).rejects.toThrow(RangeError);
    async function* twoSheets(): AsyncGenerator<TabularRow> {
      yield* sheet(FILE.slice(0, 2), "A");
      yield* sheet(FILE.slice(0, 2), "B");
    }
    await expect(
      runner.run({
        runId: "imp_4",
        rows: twoSheets(),
        mapping: MAPPING,
        target: store,
        batchSize: 5,
      }),
    ).rejects.toThrow(TypeError);
  });

  it("reverts a whole run inside its window, once", async () => {
    const { runner, store, ledger, clock } = setup();
    store.products.set("c", { sku: "c", price: 1 });
    await runner.run({
      runId: "imp_5",
      rows: sheet(FILE),
      mapping: MAPPING,
      target: store,
      batchSize: 2,
    });
    clock.at = new Date("2026-10-26T00:00:00.000Z");
    await runner.revert("imp_5", store, { window: Duration.days(7) });
    expect([...store.products.values()]).toEqual([{ sku: "c", price: 1 }]);
    expect((await ledger.find("imp_5"))?.state).toBe(ImportRunState.Reverted);
    await expect(runner.revert("imp_5", store, { window: Duration.days(7) })).rejects.toThrow(
      ImportRunClosedError,
    );
  });

  it("refuses a revert past its window or of an unknown run", async () => {
    const { runner, store, clock } = setup();
    await runner.run({
      runId: "imp_6",
      rows: sheet(FILE),
      mapping: MAPPING,
      target: store,
      batchSize: 2,
    });
    clock.at = new Date("2026-10-27T00:00:00.000Z");
    await expect(runner.revert("imp_6", store, { window: Duration.days(1) })).rejects.toThrow(
      ImportUndoExpiredError,
    );
    await expect(runner.revert("imp_0", store, { window: Duration.days(1) })).rejects.toThrow(
      ImportRunNotFoundError,
    );
  });

  it("refuses a revert once the before-images are purged", async () => {
    const { runner, store, ledger, clock } = setup();
    await runner.run({
      runId: "imp_7",
      rows: sheet(FILE),
      mapping: MAPPING,
      target: store,
      batchSize: 2,
    });
    await ledger.purge(new Date("2026-10-26T00:00:00.000Z"), clock.now());
    await expect(runner.revert("imp_7", store, { window: Duration.days(7) })).rejects.toThrow(
      ImportUndoExpiredError,
    );
  });

  describe("runSheets", () => {
    const VARIANT = z.object({ sku: z.string(), size: z.string().min(1) });
    type Variant = z.infer<typeof VARIANT>;

    class VariantStore implements ImportTarget<Variant> {
      readonly schema = VARIANT;

      readonly variants = new Map<string, Variant>();

      async upsert(records: readonly Variant[]): Promise<readonly ImportChange[]> {
        return records.map((record) => {
          const key = `${record.sku}/${record.size}`;
          this.variants.set(key, record);
          return { key, before: null };
        });
      }

      async revert(changes: readonly ImportChange[]): Promise<void> {
        for (const change of changes) this.variants.delete(change.key);
      }
    }

    const PRODUCTS = [
      ["رمز المنتج", "السعر"],
      ["a", "5"],
      ["b", "6"],
    ];
    const VARIANTS = [
      ["SKU", "Size"],
      ["a", "S"],
      ["a", ""],
      ["b", "M"],
    ];

    async function* workbook(order: readonly string[]): AsyncGenerator<TabularRow> {
      for (const name of order) {
        if (name === "Products") yield* sheet(PRODUCTS, "Products");
        if (name === "Variants") yield* sheet(VARIANTS, "Variants");
        if (name === "Notes") yield* sheet([["note"], ["ignored"]], "Notes");
      }
    }

    function plans(products: ProductStore, variants: VariantStore) {
      return [
        { sheet: "Products", mapping: MAPPING, target: products },
        { sheet: "Variants", mapping: { sku: "SKU", size: "Size" }, target: variants },
      ];
    }

    it("imports two sheets into two targets, never mixing them in a batch", async () => {
      const { runner, store, ledger } = setup();
      const variants = new VariantStore();
      const report = await runner.runSheets({
        runId: "imp_w1",
        rows: workbook(["Products", "Notes", "Variants"]),
        sheets: plans(store, variants),
        batchSize: 5,
      });
      expect(report.written).toBe(4);
      expect(report.errors).toEqual([
        { sheet: "Variants", row: 3, issues: [expect.objectContaining({ field: "size" })] },
      ]);
      expect([...store.products.keys()]).toEqual(["a", "b"]);
      expect([...variants.variants.keys()]).toEqual(["a/S", "b/M"]);
      expect((await ledger.batches("imp_w1")).map((batch) => [batch.sheet, batch.lastRow])).toEqual(
        [
          ["Products", 3],
          ["Variants", 4],
        ],
      );
    });

    it("resumes each sheet after its own cursor", async () => {
      const { runner, store } = setup();
      const variants = new VariantStore();
      const options = { runId: "imp_w2", sheets: plans(store, variants), batchSize: 1 };
      store.failOn = "b";
      await expect(
        runner.runSheets({ ...options, rows: workbook(["Products", "Variants"]) }),
      ).rejects.toThrow("batch failed");
      store.failOn = undefined;
      const report = await runner.runSheets({
        ...options,
        rows: workbook(["Products", "Variants"]),
      });
      expect(store.upserted).toEqual(["a", "b"]);
      expect(report.written).toBe(4);
    });

    it("refuses sheets out of dependency order, a duplicate and an empty list", async () => {
      const { runner, store } = setup();
      const variants = new VariantStore();
      await expect(
        runner.runSheets({
          runId: "imp_w3",
          rows: workbook(["Variants", "Products"]),
          sheets: plans(store, variants),
          batchSize: 5,
        }),
      ).rejects.toThrow(TypeError);
      expect(store.products.size).toBe(0);
      await expect(
        runner.runSheets({ runId: "imp_w4", rows: workbook([]), sheets: [], batchSize: 5 }),
      ).rejects.toThrow(TypeError);
      const products = { sheet: "Products", mapping: MAPPING, target: store };
      await expect(
        runner.runSheets({
          runId: "imp_w5",
          rows: workbook([]),
          sheets: [products, products],
          batchSize: 5,
        }),
      ).rejects.toThrow(TypeError);
    });

    it("reverts every sheet through its own target, and refuses a missing one first", async () => {
      const { runner, store } = setup();
      const variants = new VariantStore();
      await runner.runSheets({
        runId: "imp_w6",
        rows: workbook(["Products", "Variants"]),
        sheets: plans(store, variants),
        batchSize: 5,
      });
      await expect(
        runner.revert("imp_w6", { Products: store }, { window: Duration.days(7) }),
      ).rejects.toThrow(TypeError);
      expect(variants.variants.size).toBe(2);
      await runner.revert(
        "imp_w6",
        { Products: store, Variants: variants },
        { window: Duration.days(7) },
      );
      expect(store.products.size).toBe(0);
      expect(variants.variants.size).toBe(0);
    });
  });
});
