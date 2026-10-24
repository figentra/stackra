/**
 * Stackra file contract:
 * Purpose: unit tests of `takeSharedPayload`: a payload is read once (a second take is `null`), and an unknown id is
 *          `null`.
 * Boundary: test only; IndexedDB is `fake-indexeddb`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0255 (share target).
 */
import "fake-indexeddb/auto";
import { describe, expect, it } from "@stackra/testing";

import { putSharedPayload } from "#core/functions/put-shared-payload.function";
import { takeSharedPayload } from "#core/functions/take-shared-payload.function";

describe("takeSharedPayload", () => {
  it("returns the payload once", async () => {
    const id = await putSharedPayload({
      title: null,
      text: null,
      url: "https://acme.test",
      files: [],
    });
    expect(await takeSharedPayload(id)).toEqual({
      title: null,
      text: null,
      url: "https://acme.test",
      files: [],
    });
    expect(await takeSharedPayload(id)).toBeNull();
  });

  it("returns null for an unknown id", async () => {
    expect(await takeSharedPayload("no-such-id")).toBeNull();
  });
});
