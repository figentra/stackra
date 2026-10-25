/**
 * Stackra file contract:
 * Purpose: unit tests of `putSharedPayload`: each payload gets a fresh id and is stored with its files.
 * Boundary: test only; IndexedDB is `fake-indexeddb`; read back through `takeSharedPayload`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0255 (share target).
 */
import "fake-indexeddb/auto";
import { describe, expect, it } from "@stackra/testing";

import { putSharedPayload } from "#core/functions/put-shared-payload.function";
import { takeSharedPayload } from "#core/functions/take-shared-payload.function";

describe("putSharedPayload", () => {
  it("stores the payload under a fresh id", async () => {
    const file = new File(["png"], "photo.png", { type: "image/png" });
    const first = await putSharedPayload({ title: "Dates", text: null, url: null, files: [file] });
    const second = await putSharedPayload({ title: null, text: "hi", url: null, files: [] });
    expect(first).not.toBe(second);
    const stored = await takeSharedPayload(first);
    expect(stored?.title).toBe("Dates");
    expect(stored?.files.map((kept) => kept.name)).toEqual(["photo.png"]);
  });
});
