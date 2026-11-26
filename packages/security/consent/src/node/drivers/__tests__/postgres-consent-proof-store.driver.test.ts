/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresConsentProofStoreDriver`: each append runs in a savepoint of the caller's transaction
 *          (never a transaction of its own) and inserts the next verifiable link of its subject's chain, with absent
 *          fields as nulls; reads hand back the proofs exactly as appended, nulls dropped; a lost race reads the new head
 *          in a fresh savepoint and retries; five lost races refuse with `consent_proof_write_failed`; any other failure
 *          propagates after one attempt.
 * Boundary: test only; the table and the database are in-memory stand-ins of the calls the driver makes, so no Postgres
 *           runs (the integration test runs it on a real one).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (decision 3); ADR 0454 (decision 5); STA-2818.
 */
import type { PublicId } from "@stackra/contracts";
import { UniqueViolation } from "@stackra/database";
import type { Database, Repository } from "@stackra/database";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ConsentVerificationMethod } from "#contracts/enums/consent-verification-method.enum";
import { ConsentProofStore } from "#contracts/ports/consent-proof-store.port";
import type { ConsentProof } from "#contracts/types/consent-proof.type";
import { ConsentProofWriteFailedError } from "#core/errors/consent-proof-write-failed.error";
import { findConsentProofChainBreak } from "#core/functions/find-consent-proof-chain-break.function";
import type { ConsentProofLink } from "#core/types/consent-proof-link.type";
import { PostgresConsentProofStoreDriver } from "#node/drivers/postgres-consent-proof-store.driver";
import type { ConsentProofEntry } from "#node/models/consent-proof-entry.model";

const CHILD = "usr_01j9z3k4m5n6p7q8r9s0t1v2c1" as PublicId;
const PARENT = "usr_01j9z3k4m5n6p7q8r9s0t1v2p1" as PublicId;

const OWN: ConsentProof = {
  subject: CHILD,
  givenBy: CHILD,
  document: "terms",
  version: "1",
  granted: true,
  at: "2026-11-26T09:00:00.000Z",
};

const FOR_CHILD: ConsentProof = {
  subject: CHILD,
  givenBy: PARENT,
  relationship: "guardian",
  document: "photos",
  version: "2",
  contentHash: "h2",
  granted: true,
  at: "2026-11-26T10:00:00.000Z",
  channel: "guardian_app",
  verificationMethod: ConsentVerificationMethod.GuardianLogin,
  verificationReference: "cgl_1",
};

/** A stored row: the entry's columns as the ORM hands them back. */
type Row = Omit<ConsentProofEntry, "id" | "tenantId"> & { readonly id: string };

/** The driver over an in-memory table whose first `conflicts` inserts lose a race, or fail with `failure`. */
function driverWith(options: { readonly conflicts?: number; readonly failure?: Error } = {}) {
  const rows: Row[] = [];
  let conflicts = options.conflicts ?? 0;
  const matching = (where: Partial<Row>) =>
    rows.filter((row) =>
      Object.entries(where).every(([key, value]) => row[key as keyof Row] === value),
    );
  const bySequence = (direction: string) => (a: Row, b: Row) =>
    direction === "desc" ? b.sequence - a.sequence : a.sequence - b.sequence;
  const entries = {
    findOne: vi.fn(
      async (where: Partial<Row>, query: { orderBy: { sequence: string } }) =>
        matching(where).sort(bySequence(query.orderBy.sequence))[0] ?? null,
    ),
    find: vi.fn(async (where: Partial<Row>, query: { orderBy: { sequence: string } }) =>
      matching(where).sort(bySequence(query.orderBy.sequence)),
    ),
    insert: vi.fn(async (data: Omit<Row, "id">) => {
      if (options.failure !== undefined) throw options.failure;
      if (conflicts > 0) {
        conflicts -= 1;
        throw new UniqueViolation(new Error("duplicate key value violates unique constraint"));
      }
      const row = { ...data, id: `cpf_${rows.length + 1}` };
      rows.push(row);
      return row;
    }),
  };
  const database = {
    transaction: vi.fn(async (work: () => Promise<unknown>, _options?: object) => work()),
  };
  const driver = new PostgresConsentProofStoreDriver(
    entries as unknown as Repository<ConsentProofEntry>,
    database as unknown as Database,
  );
  return { driver, rows, entries, database };
}

/** The chain links the rows hold. */
const linksOf = (rows: readonly Row[]): ConsentProofLink[] =>
  rows.map((row) => ({
    subject: row.subject as PublicId,
    givenBy: row.givenBy as PublicId,
    ...(row.relationship === null ? {} : { relationship: row.relationship }),
    document: row.document,
    version: row.version,
    ...(row.contentHash === null ? {} : { contentHash: row.contentHash }),
    granted: row.granted,
    at: row.at.toISOString(),
    ...(row.channel === null ? {} : { channel: row.channel }),
    ...(row.verificationMethod === null ? {} : { verificationMethod: row.verificationMethod }),
    ...(row.verificationReference === null
      ? {}
      : { verificationReference: row.verificationReference }),
    sequence: row.sequence,
    previousHash: row.previousHash,
    hash: row.hash,
  }));

describe("PostgresConsentProofStoreDriver", () => {
  it("is a ConsentProofStore", () => {
    expect(driverWith().driver).toBeInstanceOf(ConsentProofStore);
  });

  it("appends each proof as its subject's next link in a savepoint of the caller's transaction", async () => {
    const { driver, rows, database } = driverWith();
    await driver.append(OWN);
    await driver.append(FOR_CHILD);
    expect(database.transaction).toHaveBeenCalledTimes(2);
    expect(database.transaction).toHaveBeenCalledWith(expect.any(Function));
    expect(rows.map((row) => [row.sequence, row.document])).toEqual([
      [1, "terms"],
      [2, "photos"],
    ]);
    expect(rows[0]).toMatchObject({
      relationship: null,
      contentHash: null,
      channel: null,
      verificationMethod: null,
      verificationReference: null,
      at: new Date("2026-11-26T09:00:00.000Z"),
    });
    expect(rows[1]?.previousHash).toBe(rows[0]?.hash);
    await expect(findConsentProofChainBreak(linksOf(rows))).resolves.toBeUndefined();
  });

  it("reads the proofs back exactly as appended", async () => {
    const { driver } = driverWith();
    await driver.append(OWN);
    await driver.append(FOR_CHILD);
    await driver.append({ ...OWN, version: "2", at: "2026-11-26T11:00:00.000Z" });
    expect(await driver.list(CHILD)).toStrictEqual([
      OWN,
      FOR_CHILD,
      { ...OWN, version: "2", at: "2026-11-26T11:00:00.000Z" },
    ]);
    expect(await driver.latest(CHILD, "terms")).toStrictEqual({
      ...OWN,
      version: "2",
      at: "2026-11-26T11:00:00.000Z",
    });
    expect(await driver.latest(CHILD, "photos")).toStrictEqual(FOR_CHILD);
    expect(await driver.latest(CHILD, "privacy")).toBeUndefined();
    expect(await driver.list(PARENT)).toEqual([]);
  });

  it("reads the new head in a fresh savepoint and retries after a lost race", async () => {
    const { driver, rows, entries, database } = driverWith({ conflicts: 1 });
    await driver.append(OWN);
    expect(database.transaction).toHaveBeenCalledTimes(2);
    expect(entries.findOne).toHaveBeenCalledTimes(2);
    expect(rows).toHaveLength(1);
  });

  it("refuses after five lost races and lets any other failure through after one attempt", async () => {
    const racing = driverWith({ conflicts: 5 });
    const refused: unknown = await racing.driver.append(OWN).catch((error: unknown) => error);
    expect(isRefusal(refused, ConsentProofWriteFailedError)).toBe(true);
    expect(racing.entries.insert).toHaveBeenCalledTimes(5);

    const failure = new Error("connection reset");
    const failing = driverWith({ failure });
    await expect(failing.driver.append(OWN)).rejects.toBe(failure);
    expect(failing.entries.insert).toHaveBeenCalledTimes(1);
  });
});
