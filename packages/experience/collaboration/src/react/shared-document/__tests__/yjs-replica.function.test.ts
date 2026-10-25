/**
 * Stackra file contract:
 * Purpose: unit tests of `yjsReplica(doc)`: local changes are reported as updates another replica can apply, applied
 *          remote updates are never reported back (no echo), applying twice is harmless, `encode` restores a fresh
 *          document, and removing the listener stops the reports.
 * Boundary: test only; real Yjs documents.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 2: Yjs).
 */
import { describe, expect, it } from "@stackra/testing";
import { Doc } from "yjs";

import { yjsReplica } from "#react/shared-document/yjs-replica.function";

describe("yjsReplica", () => {
  it("reports local changes and applies them elsewhere without echo", () => {
    const left = new Doc();
    const right = new Doc();
    const leftReplica = yjsReplica(left);
    const rightReplica = yjsReplica(right);
    const fromLeft: Uint8Array[] = [];
    const fromRight: Uint8Array[] = [];
    leftReplica.onUpdate((update) => fromLeft.push(update));
    rightReplica.onUpdate((update) => fromRight.push(update));
    left.getText("title").insert(0, "Home");
    expect(fromLeft).toHaveLength(1);
    for (const update of fromLeft) rightReplica.apply(update);
    for (const update of fromLeft) rightReplica.apply(update);
    expect(right.getText("title").toString()).toBe("Home");
    expect(fromRight).toEqual([]);
  });

  it("encodes the full state, which restores a fresh document", () => {
    const doc = new Doc();
    doc.getArray<string>("blocks").push(["hero", "pricing"]);
    const fresh = new Doc();
    yjsReplica(fresh).apply(yjsReplica(doc).encode());
    expect(fresh.getArray<string>("blocks").toArray()).toEqual(["hero", "pricing"]);
  });

  it("stops reporting once the listener is removed", () => {
    const doc = new Doc();
    const updates: Uint8Array[] = [];
    const stop = yjsReplica(doc).onUpdate((update) => updates.push(update));
    stop();
    doc.getText("title").insert(0, "x");
    expect(updates).toEqual([]);
  });
});
