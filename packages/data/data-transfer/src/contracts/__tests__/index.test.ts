/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the three ports and `ImportRunState` are exported and
 *          nothing else is, and the public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0367.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  ImportBatchEntry,
  ImportChange,
  ImportRunRecord,
  ImportTarget,
  RowError,
  RowIssue,
  TabularCell,
  TabularReadOptions,
  TabularRow,
  TabularSheet,
  TabularSource,
  TabularWriteOptions,
  TransferLimits,
} from "#contracts/index";

describe("@stackra/data-transfer/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "ImportLedger",
      "ImportRunState",
      "TabularReader",
      "TabularWriter",
    ]);
  });

  it("resolves its public types", () => {
    expectTypeOf<TabularRow["cells"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<TabularCell>().toEqualTypeOf<string | number | boolean | Date | null>();
    expectTypeOf<TransferLimits["rows"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<TabularReadOptions["limits"]>().toEqualTypeOf<TransferLimits | undefined>();
    expectTypeOf<TabularWriteOptions["formulaGuard"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<TabularSheet["name"]>().toEqualTypeOf<string>();
    expectTypeOf<Uint8Array[]>().toExtend<TabularSource>();
    expectTypeOf<ImportBatchEntry["changes"]>().toEqualTypeOf<readonly ImportChange[]>();
    expectTypeOf<ImportRunRecord["cursor"]>().toEqualTypeOf<number>();
    expectTypeOf<RowError["issues"]>().toEqualTypeOf<readonly RowIssue[]>();
    expectTypeOf<ImportTarget<{ sku: string }>["upsert"]>()
      .parameter(0)
      .toEqualTypeOf<readonly { sku: string }[]>();
  });
});
