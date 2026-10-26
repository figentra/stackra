/**
 * Stackra file contract:
 * Purpose: unit tests of `ServiceAckService`: `expect` stores one set per subject (nothing to wait for without
 *          services; a second call keeps the first set) and refuses a bad service key; `ack` records each service once
 *          and reports the expected services only on the ack that completes the set; an ack for a subject nobody
 *          expects, or for a complete set, reports nothing.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0210 (decision 6); ADR 0427 (decision 1).
 */
import { Database, registerModelPartners } from "@stackra/database";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ServiceAckSet } from "#node/models/service-ack-set.model";
import { ServiceAckService } from "#node/services/service-ack.service";

registerModelPartners([[ServiceAckService, ServiceAckSet]]);

/** Connects a recording entity manager whose only row is `stored`; created rows are kept. */
function connect(stored?: ServiceAckSet) {
  const created: ServiceAckSet[] = [];
  const em = {
    findOne: vi.fn(async () => stored ?? null),
    create: vi.fn((Row: new () => ServiceAckSet, data: object) => {
      const row = Object.assign(new Row(), data);
      created.push(row);
      return row;
    }),
    flush: vi.fn(async () => undefined),
    transactional: vi.fn(async (work: (manager: unknown) => Promise<unknown>) => work(em)),
  };
  vi.spyOn(Database, "current").mockReturnValue({
    em: () => em as unknown as ReturnType<Database["em"]>,
  } as unknown as Database);
  return { created };
}

/** A stored set of `tnt_1` expecting commerce and billing. */
const storedSet = (fields: Partial<ServiceAckSet> = {}): ServiceAckSet =>
  Object.assign(new ServiceAckSet(), {
    subject: "tnt_1",
    expected: ["commerce", "billing"],
    ...fields,
  });

afterEach(() => {
  vi.restoreAllMocks();
});

describe(ServiceAckService, () => {
  it("stores one set per subject and keeps the first", async () => {
    const { created } = connect();
    expect(await new ServiceAckService().expect("tnt_1", ["commerce", "billing", "commerce"])).toBe(
      false,
    );
    expect(created[0]).toMatchObject({ subject: "tnt_1", expected: ["commerce", "billing"] });

    connect(storedSet());
    expect(await new ServiceAckService().expect("tnt_1", ["other"])).toBe(false);
    connect(storedSet({ completedAt: new Date() }));
    expect(await new ServiceAckService().expect("tnt_1", ["commerce"])).toBe(true);
  });

  it("has nothing to wait for without services, and refuses a bad key", async () => {
    const { created } = connect();
    expect(await new ServiceAckService().expect("tnt_2", [])).toBe(true);
    expect(created[0]?.completedAt).toBeInstanceOf(Date);
    await expect(new ServiceAckService().expect("tnt_2", ["Bad-Key"])).rejects.toThrow(TypeError);
    await expect(new ServiceAckService().expect("", ["commerce"])).rejects.toThrow(TypeError);
  });

  it("reports the services only on the ack that completes the set", async () => {
    const set = storedSet();
    connect(set);
    const acks = new ServiceAckService();
    expect(await acks.ack("tnt_1", "billing")).toBeUndefined();
    expect(await acks.ack("tnt_1", "billing")).toBeUndefined();
    expect(set.acked).toEqual(["billing"]);
    expect(await acks.ack("tnt_1", "commerce")).toEqual(["commerce", "billing"]);
    expect(set.completedAt).toBeInstanceOf(Date);
    expect(await acks.ack("tnt_1", "commerce")).toBeUndefined();
  });

  it("ignores an ack for a subject nobody expects", async () => {
    connect();
    expect(await new ServiceAckService().ack("tnt_9", "commerce")).toBeUndefined();
  });
});
