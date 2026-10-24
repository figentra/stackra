/**
 * Stackra file contract:
 * Purpose: unit tests of `idbRequest`: it resolves with a request's result and rejects with its error.
 * Boundary: test only; IndexedDB is `fake-indexeddb`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0255 (share target).
 */
import "fake-indexeddb/auto";
import { describe, expect, it } from "@stackra/testing";

import { idbRequest } from "#core/functions/idb-request.function";

describe("idbRequest", () => {
  it("resolves with the result", async () => {
    const db = await idbRequest(indexedDB.open("idb_request_test", 1));
    expect(db.name).toBe("idb_request_test");
    db.close();
  });

  it("rejects with the request's error", async () => {
    const db = await idbRequest(indexedDB.open("idb_request_downgrade", 2));
    db.close();
    await expect(idbRequest(indexedDB.open("idb_request_downgrade", 1))).rejects.toBeTruthy();
  });
});
