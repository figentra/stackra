/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalService`: the pack picks the driver per market and channel, a channel with no mandate
 *          seals nothing, an unknown driver is refused, sealing chains and is idempotent, a race is a conflict,
 *          submission runs in order and stops at an unreachable authority, the offline status reads the pack's
 *          window, and the export uses the pack's driver.
 * Boundary: test only; a recording driver, the memory journal and the pack fake stand in. Pack values are samples.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decisions 1 to 3).
 */
import { Clock } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalChannel } from "#contracts/enums/fiscal-channel.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { FiscalDriver } from "#contracts/ports/fiscal-driver.port";
import type { DriverContext } from "#contracts/types/driver-context.type";
import type { FiscalDocument } from "#contracts/types/fiscal-document.type";
import type { FiscalMandate } from "#contracts/types/fiscal-mandate.type";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";
import type { JournalExport } from "#contracts/types/journal-export.type";
import type { SealContext } from "#contracts/types/seal-context.type";
import type { SealedPayload } from "#contracts/types/sealed-payload.type";
import type { SubmissionOutcome } from "#contracts/types/submission-outcome.type";
import { MemoryFiscalJournalDriver } from "#core/drivers/memory-fiscal-journal.driver";
import { FiscalAuthorityUnavailableError } from "#core/errors/fiscal-authority-unavailable.error";
import { FiscalChainConflictError } from "#core/errors/fiscal-chain-conflict.error";
import { FiscalDriverMissingError } from "#core/errors/fiscal-driver-missing.error";
import { FiscalService } from "#core/services/fiscal.service";
import { fiscalDocument } from "#testing/fiscal-document.fixture";
import { FiscalPackSourceFake } from "#testing/fiscal-pack-source.fake";

/** A clock the test moves. */
class TestClock extends Clock {
  current = new Date("2026-03-01T10:00:00Z");

  now(): Date {
    return new Date(this.current);
  }
}

/** A driver that records its calls and answers submissions from a queue. */
class RecordingDriver extends FiscalDriver {
  readonly key: string;

  readonly sealed: SealContext[] = [];

  readonly answers: (SubmissionOutcome | "unavailable")[] = [];

  constructor(key: string) {
    super();
    this.key = key;
  }

  async seal(document: FiscalDocument, context: SealContext): Promise<SealedPayload> {
    this.sealed.push(context);
    return {
      payload: document.number,
      contentType: "text/plain",
      hash: `${this.key}-${context.sequence}`,
      signature: null,
      qr: null,
      marks: {},
      status: FiscalRecordStatus.Sealed,
    };
  }

  async submit(): Promise<SubmissionOutcome> {
    const answer = this.answers.shift() ?? {
      status: FiscalRecordStatus.Accepted,
      authorityReference: null,
      message: null,
      payload: null,
    };
    if (answer === "unavailable")
      throw FiscalAuthorityUnavailableError.create({ driver: this.key, status: 503 });
    return answer;
  }

  async exportJournal(
    records: readonly FiscalRecord[],
    context: DriverContext,
  ): Promise<JournalExport> {
    return {
      fileName: `${context.unitId}.${this.key}`,
      contentType: "text/plain",
      encoding: "utf-8",
      content: String(records.length),
    };
  }
}

const mandate = (driver: string, reportingWindowHours: number | null = null): FiscalMandate => ({
  driver,
  options: { sample: true },
  reportingWindowHours,
  retentionYears: null,
});
const till = { market: "xx", channel: FiscalChannel.Till, unitId: "till_1" } as const;

/** A service over one market whose till channel uses `till-driver` and invoice channel `invoice-driver`. */
const setup = (window: number | null = null) => {
  const tillDriver = new RecordingDriver("till-driver");
  const invoiceDriver = new RecordingDriver("invoice-driver");
  const packs = FiscalPackSourceFake.with({
    xx: { invoice: mandate("invoice-driver"), till: mandate("till-driver", window) },
    yy: { invoice: null, till: null },
  });
  const journal = new MemoryFiscalJournalDriver();
  const clock = new TestClock();
  const service = new FiscalService([tillDriver, invoiceDriver], packs, journal, clock);
  return { service, tillDriver, invoiceDriver, packs, journal, clock };
};

describe("FiscalService#seal", () => {
  it("seals with the driver the pack names for the channel, on the chain", async () => {
    const { service, tillDriver, invoiceDriver } = setup();
    const first = await service.seal(fiscalDocument(), till);
    const second = await service.seal(fiscalDocument({ id: "doc-2", number: "INV-0002" }), till);
    expect([first?.driver, first?.sequence, first?.previousHash]).toEqual(["till-driver", 1, null]);
    expect([second?.sequence, second?.previousHash]).toEqual([2, "till-driver-1"]);
    expect(tillDriver.sealed[1]?.previous).toEqual(first);
    expect(tillDriver.sealed[0]?.options).toEqual({ sample: true });
    expect(invoiceDriver.sealed).toEqual([]);
    expect(first?.sealedAt).toEqual(new Date("2026-03-01T10:00:00Z"));
  });

  it("reads the pack on the document's issue date", async () => {
    const { service, packs } = setup();
    await service.seal(fiscalDocument(), till);
    expect(packs.asked).toEqual([{ market: "xx", on: fiscalDocument().issuedAt }]);
  });

  it("returns the stored record when the document was already sealed", async () => {
    const { service, tillDriver } = setup();
    const first = await service.seal(fiscalDocument(), till);
    expect(await service.seal(fiscalDocument(), till)).toBe(first);
    expect(tillDriver.sealed).toHaveLength(1);
  });

  it("seals nothing where the pack asks nothing", async () => {
    const { service } = setup();
    expect(await service.seal(fiscalDocument(), { ...till, market: "yy" })).toBeNull();
    expect(await service.seal(fiscalDocument(), { ...till, market: "zz" })).toBeNull();
  });

  it("refuses a driver the host did not register", async () => {
    const { service, packs } = setup();
    packs.set("xx", { invoice: null, till: mandate("unknown") });
    await expect(service.seal(fiscalDocument(), till)).rejects.toSatisfy(
      (error: unknown) =>
        isRefusal(error, FiscalDriverMissingError) && error.details.driver === "unknown",
    );
  });

  it("refuses a seal that lost the race for its chain position", async () => {
    const { service, journal } = setup();
    const original = journal.append.bind(journal);
    journal.append = async () => false;
    await expect(service.seal(fiscalDocument(), till)).rejects.toSatisfy((error: unknown) =>
      isRefusal(error, FiscalChainConflictError),
    );
    journal.append = original;
  });
});

describe("FiscalService#submitPending", () => {
  it("submits in sequence order and stores each answer", async () => {
    const { service, tillDriver, journal } = setup();
    await service.seal(fiscalDocument(), till);
    await service.seal(fiscalDocument({ id: "doc-2", number: "INV-0002" }), till);
    tillDriver.answers.push(
      {
        status: FiscalRecordStatus.Accepted,
        authorityReference: "A1",
        message: null,
        payload: "cleared",
      },
      {
        status: FiscalRecordStatus.Rejected,
        authorityReference: null,
        message: "bad",
        payload: null,
      },
    );
    const answered = await service.submitPending(till, 10);
    expect(answered.map((record) => [record.sequence, record.status, record.payload])).toEqual([
      [1, "accepted", "cleared"],
      [2, "rejected", "INV-0002"],
    ]);
    expect(await journal.pending("till_1", 10)).toEqual([]);
    expect(answered[0]?.submittedAt).toEqual(new Date("2026-03-01T10:00:00Z"));
  });

  it("stops at an unreachable authority and keeps the rest sealed", async () => {
    const { service, tillDriver, journal } = setup();
    await service.seal(fiscalDocument(), till);
    await service.seal(fiscalDocument({ id: "doc-2", number: "INV-0002" }), till);
    tillDriver.answers.push("unavailable");
    expect(await service.submitPending(till, 10)).toEqual([]);
    expect(await journal.pending("till_1", 10)).toHaveLength(2);
  });
});

describe("FiscalService#offlineStatus", () => {
  it("reports the backlog against the pack's window", async () => {
    const { service, clock } = setup(24);
    await service.seal(fiscalDocument(), till);
    const status = await service.offlineStatus(till);
    expect(status).toEqual({
      pending: 1,
      oldestSealedAt: new Date("2026-03-01T10:00:00Z"),
      deadline: new Date("2026-03-02T10:00:00Z"),
      overdue: false,
    });
    clock.current = new Date("2026-03-02T10:00:00Z");
    expect((await service.offlineStatus(till)).overdue).toBe(true);
  });

  it("has no deadline without a window or a backlog", async () => {
    const { service } = setup(null);
    expect(await service.offlineStatus(till)).toEqual({
      pending: 0,
      oldestSealedAt: null,
      deadline: null,
      overdue: false,
    });
    await service.seal(fiscalDocument(), till);
    expect((await service.offlineStatus(till)).deadline).toBeNull();
  });
});

describe("FiscalService#exportJournal", () => {
  it("exports the range through the pack's driver", async () => {
    const { service } = setup();
    await service.seal(fiscalDocument(), till);
    const file = await service.exportJournal(
      till,
      new Date("2026-03-01T00:00:00Z"),
      new Date("2026-03-02T00:00:00Z"),
    );
    expect(file).toEqual({
      fileName: "till_1.till-driver",
      contentType: "text/plain",
      encoding: "utf-8",
      content: "1",
    });
    expect(
      await service.exportJournal({ ...till, market: "yy" }, new Date(0), new Date()),
    ).toBeNull();
  });
});
