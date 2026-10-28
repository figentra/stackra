/**
 * Stackra file contract:
 * Purpose: unit tests of `EraseSubjectWorkflow`: `erase` deletes delete-rows, anonymises anonymise-rows and leaves
 *          shred-rows to the key; a legal hold keeps its rows and, when they carry shredded fields, keeps the key;
 *          `receipt` records `SubjectErased` and, when asked, the `ServiceAcked` erasure ack; `output` is the receipt;
 *          a shredded field that is not subject-sealed refuses the erasure before any row is touched.
 * Boundary: test only; the steps are called directly in order with a hand-built run and step context, the memory
 *           store, the salt fake and a hold registry connected through `connectHoldRegistry`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0189 (decisions 2 and 4); ADR 0134; ADR 0212; STA-1375; stackra-263.
 */
import type { AnyClass } from "@stackra/container";
import { Driver } from "@stackra/container";
import { HasEncryptedFields, Model } from "@stackra/model";
import { connectHoldRegistry } from "@stackra/database";
import { HoldRegistry } from "@stackra/database/contracts";
import type { Event } from "@stackra/events";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { ServiceAcked } from "@stackra/workflow";
import type { StepContext } from "@stackra/workflow";

import { ErasureMethod } from "#contracts/enums/erasure-method.enum";
import { Address } from "#core/__tests__/address.fixture";
import { AddressPersonalData } from "#core/__tests__/address-personal-data.fixture";
import { Customer } from "#core/__tests__/customer.fixture";
import { CustomerPersonalData } from "#core/__tests__/customer-personal-data.fixture";
import { SUBJECT } from "#core/__tests__/subject.fixture";
import { PersonalData } from "#core/bases/personal-data.base";
import { MemoryPersonalDataStoreDriver } from "#core/drivers/memory-personal-data-store.driver";
import { SubjectErased } from "#core/events/subject-erased.event";
import { registerPersonalData } from "#core/functions/register-personal-data.function";
import { EraseSubjectOutput } from "#node/schemas/erase-subject-output.schema";
import { EraseSubjectWorkflow } from "#node/workflows/erase-subject.workflow";
import { clearPersonalData } from "#testing/clear-personal-data.function";
import { SubjectSaltStoreFake } from "#testing/subject-salt-store.fake";

/** A note sealed under the scope's key, not the subject's. */
class Note extends Model.with(HasEncryptedFields("body")) {
  id!: string;

  userId!: string;

  body!: string;
}

/** Wrongly shreds the scope-sealed body. */
class NotePersonalData extends PersonalData({
  model: () => Note,
  subject: "userId",
  fields: { body: ErasureMethod.Shred },
}) {}

/** When every run ends. */
const NOW = new Date("2026-10-28T12:00:00Z");

/** Holds the listed ids of one model. */
class ListHoldRegistryDriver extends Driver(HoldRegistry) {
  readonly held: Set<string>;

  constructor(held: readonly string[]) {
    super();
    this.held = new Set(held);
  }

  async heldAmong<M extends object>(_model: AnyClass<M>, ids: readonly string[]) {
    return new Set(ids.filter((id) => this.held.has(id)));
  }
}

/** The subject's two customers and two addresses, and another person's address. */
function seeded(): MemoryPersonalDataStoreDriver {
  const store = new MemoryPersonalDataStoreDriver();
  store.put(Customer, [
    { id: "cus_1", userId: SUBJECT, name: "sealed:1", phone: "+966500000000" },
    { id: "cus_2", userId: SUBJECT, name: "sealed:2", phone: "+966500000001" },
  ]);
  store.put(Address, [
    { id: "adr_1", userId: SUBJECT, line: "1 King Fahd Rd" },
    { id: "adr_2", userId: SUBJECT, line: "2 Olaya St" },
    { id: "adr_3", userId: "usr_other", line: "3 Tahlia St" },
  ]);
  return store;
}

/** Runs every step in order, as the engine would, and returns the output and the recorded events. */
async function runAll(
  workflow: EraseSubjectWorkflow,
  input: { erasureId: string; subject: string; ackAs?: string },
) {
  const events: Event[] = [];
  const ctx = { now: () => new Date(NOW), record: (event: Event) => events.push(event) };
  const results: Record<string, unknown> = {};
  const run = { id: "wfr_1", input, results } as never;
  results["erase"] = await workflow.erase(run);
  results["shred"] = await workflow.shred(run);
  results["receipt"] = await workflow.receipt(run, ctx as unknown as StepContext);
  return { output: workflow.output(run), events };
}

afterEach(() => {
  clearPersonalData();
  connectHoldRegistry(undefined);
});

describe("EraseSubjectWorkflow", () => {
  it("deletes, anonymises, shreds the key and issues the receipt", async () => {
    registerPersonalData("crm", [CustomerPersonalData, AddressPersonalData]);
    const store = seeded();
    const salts = SubjectSaltStoreFake.holding([SUBJECT]);

    const { output, events } = await runAll(new EraseSubjectWorkflow(store, salts), {
      erasureId: "era_1",
      subject: SUBJECT,
    });

    expect(store.all(Address).map(({ id }) => id)).toEqual(["adr_3"]);
    expect(store.all(Customer).map(({ id, name, phone }) => ({ id, name, phone }))).toEqual([
      { id: "cus_1", name: "sealed:1", phone: null },
      { id: "cus_2", name: "sealed:2", phone: null },
    ]);
    expect(salts.calls("destroy")).toEqual([SUBJECT]);
    expect(output).toBeInstanceOf(EraseSubjectOutput);
    expect({ ...output }).toEqual({
      erasureId: "era_1",
      subject: SUBJECT,
      erased: [
        { kind: "crm.customer", method: "anonymise", count: 2 },
        { kind: "crm.address", method: "delete", count: 2 },
      ],
      kept: [],
      shredded: true,
      at: NOW.toISOString(),
    });
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(SubjectErased);
  });

  it("keeps held rows and the key when a held row has shredded fields", async () => {
    registerPersonalData("crm", [CustomerPersonalData, AddressPersonalData]);
    connectHoldRegistry(new ListHoldRegistryDriver(["cus_2", "adr_2"]));
    const store = seeded();
    const salts = SubjectSaltStoreFake.holding([SUBJECT]);

    const { output } = await runAll(new EraseSubjectWorkflow(store, salts), {
      erasureId: "era_2",
      subject: SUBJECT,
    });

    expect(store.all(Address).map(({ id }) => id)).toEqual(["adr_2", "adr_3"]);
    expect(store.all(Customer).find(({ id }) => id === "cus_2")?.["phone"]).toBe("+966500000001");
    expect(salts.calls("destroy")).toEqual([]);
    expect(output.shredded).toBe(false);
    expect(output.erased).toEqual([
      { kind: "crm.customer", method: "anonymise", count: 1 },
      { kind: "crm.address", method: "delete", count: 1 },
    ]);
    expect(output.kept).toEqual([
      { kind: "crm.customer", reason: "hold", count: 1 },
      { kind: "crm.address", reason: "hold", count: 1 },
    ]);
  });

  it("still shreds when only rows without shredded fields are held", async () => {
    registerPersonalData("crm", [AddressPersonalData]);
    connectHoldRegistry(new ListHoldRegistryDriver(["adr_1"]));
    const salts = SubjectSaltStoreFake.holding([SUBJECT]);

    const { output } = await runAll(new EraseSubjectWorkflow(seeded(), salts), {
      erasureId: "era_3",
      subject: SUBJECT,
    });

    expect(output.shredded).toBe(true);
    expect(output.kept).toEqual([{ kind: "crm.address", reason: "hold", count: 1 }]);
  });

  it("acks the waiting service with what it kept", async () => {
    registerPersonalData("crm", [AddressPersonalData]);
    connectHoldRegistry(new ListHoldRegistryDriver(["adr_1"]));

    const { events } = await runAll(
      new EraseSubjectWorkflow(seeded(), SubjectSaltStoreFake.holding([])),
      { erasureId: "era_4", subject: SUBJECT, ackAs: "commerce" },
    );

    const ack = events.find((event) => event instanceof ServiceAcked) as ServiceAcked | undefined;
    expect(ack?.subject).toBe("era_4");
    expect(ack?.service).toBe("commerce");
    expect(ack?.kept).toEqual([{ kind: "crm.address", reason: "hold", count: 1 }]);
  });

  it("declares the steps in order and no undo", () => {
    const steps = Object.getOwnPropertyNames(EraseSubjectWorkflow.prototype).filter(
      (name) => name !== "constructor",
    );
    expect(steps).toEqual(["erase", "shred", "receipt", "output"]);
  });

  it("refuses to erase anything while a shredded field is not subject-sealed", async () => {
    registerPersonalData("crm", [CustomerPersonalData, NotePersonalData]);
    const store = seeded();
    const salts = SubjectSaltStoreFake.holding([SUBJECT]);
    const workflow = new EraseSubjectWorkflow(store, salts);

    await expect(runAll(workflow, { erasureId: "era_1", subject: SUBJECT })).rejects.toThrow(
      /crm\.note\.body/,
    );
    expect(store.all(Customer)).toHaveLength(2);
    expect(salts.calls("destroy")).toEqual([]);
  });
});
