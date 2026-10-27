/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryFiscalDriver`: its key, a sealed payload chained to the previous hash, the logged and
 *          accepted submission and the JSON-lines export.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { FiscalDriver } from "#contracts/ports/fiscal-driver.port";
import { MemoryFiscalDriver } from "#core/drivers/memory-fiscal.driver";
import { fiscalDocument } from "#testing/fiscal-document.fixture";
import { fiscalRecord } from "#testing/fiscal-record.fixture";

const context = { unitId: "till_1", options: {}, previous: null, sequence: 1, now: new Date(0) };

describe("MemoryFiscalDriver", () => {
  it("is the FiscalDriver keyed memory", () => {
    const driver = new MemoryFiscalDriver();
    expect(driver).toBeInstanceOf(FiscalDriver);
    expect(driver.key).toBe("memory");
  });

  it("seals offline and chains a later record to the previous hash", async () => {
    const driver = new MemoryFiscalDriver();
    const first = await driver.seal(fiscalDocument(), context);
    expect(first.status).toBe(FiscalRecordStatus.Sealed);
    expect(first.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.parse(first.payload)).toMatchObject({ sequence: 1, previousHash: null });
    const again = await driver.seal(fiscalDocument(), context);
    expect(again.hash).toBe(first.hash);
    const second = await driver.seal(fiscalDocument(), {
      ...context,
      previous: fiscalRecord({ hash: first.hash }),
      sequence: 2,
    });
    expect(JSON.parse(second.payload)).toMatchObject({ sequence: 2, previousHash: first.hash });
    expect(second.hash).not.toBe(first.hash);
    expect(second.marks).toEqual({ sequence: "2" });
  });

  it("logs and accepts every submission", async () => {
    const driver = new MemoryFiscalDriver();
    const record = fiscalRecord({ sequence: 3 });
    const outcome = await driver.submit(record, context);
    expect(outcome).toEqual({
      status: FiscalRecordStatus.Accepted,
      authorityReference: "memory-3",
      message: null,
      payload: null,
    });
    expect(driver.submitted).toEqual([record]);
  });

  it("exports the records as JSON lines", async () => {
    const exported = await new MemoryFiscalDriver().exportJournal([fiscalRecord()], context);
    expect(exported.fileName).toBe("till_1.memory.jsonl");
    expect(exported.content.trim().split("\n")).toHaveLength(1);
  });
});
