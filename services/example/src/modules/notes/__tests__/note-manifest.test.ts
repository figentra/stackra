/**
 * Stackra file contract:
 * Purpose: pins what the committed `stackra.manifest.json` says about the five note operations: their permission and risk,
 *          and the MCP tool hints an agent reads before it calls one. `note.delete` hard-deletes, so it declares the
 *          `irreversible` effect and its tool says `destructiveHint: true`; every other write says false, and the two
 *          queries are read only.
 * Boundary: unit tier; reads the committed manifest as a file, so a change to an action's effects, permission or risk that was not
 *           regenerated (or a regeneration that silently flips a hint) fails here. The cursor of `note.list` is asserted to be
 *           a note's public id in the same manifest.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (identities are derived and locked in the manifest); ADR 0155
 *                     (queries are MCP tools); ADR 0099 (risk).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

interface ManifestAction {
  readonly key: string;
  readonly kind: "action" | "query";
  readonly risk: string;
  readonly permission: string;
  readonly effects?: readonly string[];
  readonly tool?: {
    readonly hints: {
      readonly readOnlyHint: boolean;
      readonly destructiveHint: boolean;
      readonly idempotentHint: boolean;
      readonly openWorldHint: boolean;
    };
  };
}

const manifest = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("../../../../stackra.manifest.json", import.meta.url)),
    "utf8",
  ),
) as {
  readonly actions: readonly ManifestAction[];
  readonly schemas: Readonly<
    Record<
      string,
      { readonly properties?: Readonly<Record<string, { readonly pattern?: string }>> }
    >
  >;
};

/** The operations of the notes module (the manifest also lists the hosted packages' own). */
const operations = manifest.actions.filter((action) => action.key.startsWith("notes."));

/** The manifest entry of one note operation. */
function entry(key: string): ManifestAction {
  const found = operations.find((action) => action.key === key);
  if (found === undefined)
    throw new Error(`${key} is not in stackra.manifest.json: run stackra gen`);
  return found;
}

/** The manifest of the notes module. */
describe("stackra.manifest.json: the note operations", () => {
  /** The five operations, no more. */
  it("lists exactly the five note operations", () => {
    expect(operations.map((action) => action.key).toSorted()).toEqual([
      "notes.note.create@1",
      "notes.note.delete@1",
      "notes.note.get@1",
      "notes.note.list@1",
      "notes.note.update@1",
    ]);
  });

  /** The delete removes the row for good: the effect says so and the tool warns the agent. */
  it("marks note.delete irreversible and its tool destructive", () => {
    const remove = entry("notes.note.delete@1");
    expect(remove.effects).toEqual(["irreversible"]);
    expect(remove.tool?.hints.destructiveHint).toBe(true);
    expect(remove.tool?.hints.readOnlyHint).toBe(false);
  });

  /** Nothing else is destructive: create and update add or change a row, queries change nothing. */
  it("leaves every other operation non-destructive", () => {
    for (const key of [
      "notes.note.create@1",
      "notes.note.update@1",
      "notes.note.get@1",
      "notes.note.list@1",
    ]) {
      expect(entry(key).tool?.hints.destructiveHint, key).toBe(false);
      expect(entry(key).effects, key).toBeUndefined();
    }
  });

  /** The queries are read only, the writes are not. */
  it("marks the queries read only and the writes not", () => {
    expect(entry("notes.note.get@1").tool?.hints.readOnlyHint).toBe(true);
    expect(entry("notes.note.list@1").tool?.hints.readOnlyHint).toBe(true);
    for (const key of ["notes.note.create@1", "notes.note.update@1", "notes.note.delete@1"])
      expect(entry(key).tool?.hints.readOnlyHint, key).toBe(false);
  });

  /** The list cursor is a note's public id in the contract, not a free string: a malformed one is a client error. */
  it("types the note.list cursor as a note's public id", () => {
    const pattern = manifest.schemas["notes.ListNotesInput"]?.properties?.["cursor"]?.pattern;
    expect(pattern).toBe("^not_[0-9A-Za-z]{26}$");
    expect(new RegExp(pattern ?? "").test("not_01ja0000000000000000000001")).toBe(true);
    expect(new RegExp(pattern ?? "").test("bogus")).toBe(false);
  });

  /** Gen derives each permission from the key, and the risk from the permission. */
  it("derives the permission and the risk of each operation", () => {
    const facts = operations.map(({ key, permission, risk }) => [key, permission, risk]);
    expect(facts.toSorted()).toEqual([
      ["notes.note.create@1", "notes.note.create", "L2"],
      ["notes.note.delete@1", "notes.note.delete", "L2"],
      ["notes.note.get@1", "notes.note.read", "L0"],
      ["notes.note.list@1", "notes.note.read", "L0"],
      ["notes.note.update@1", "notes.note.update", "L2"],
    ]);
  });
});
