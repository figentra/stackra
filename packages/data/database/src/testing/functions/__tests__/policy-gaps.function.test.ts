/**
 * Stackra file contract:
 * Purpose: unit tests of `policyGaps`: the one permissive owner equality passes, beside a restrictive policy named
 *          after its column; a missing, restrictive, per-command or non-equality owner policy, a second permissive
 *          policy and a misnamed restrictive policy are each a gap. A platform-form owner policy needs its two
 *          restrictive write policies, whose names pass only beside it; `_write_update` passes the system-access role
 *          exactly when the table declares system update, and tests what `_write_delete` does otherwise.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0347 (decisions 1, 2 and 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { policyGaps } from "#testing/functions/policy-gaps.function";
import type { PolicyRow } from "#testing/types/policy-row.type";

const EQUALITY = "((owner_id)::text = current_setting('app.owner_id'::text, true))";

const OWNER: PolicyRow = {
  name: "pol_notes_owner_id",
  permissive: true,
  command: "*",
  using: EQUALITY,
  check: "",
};

const KIND: PolicyRow = {
  name: "pol_notes_kind",
  permissive: false,
  command: "*",
  using: "true",
  check: "",
};

/** The gap of a platform-form owner policy missing its `suffix` write policy, a `FOR command`. */
const need = (suffix: string, command: string) =>
  `notes.notes: pol_notes_owner_id is the platform form, so it needs pol_notes_owner_id_write_${suffix}, a restrictive FOR ${command} policy testing owner_id against app.owner_id`;

/** The gaps of `notes.notes` with `policies`, and its system-access update policy when `systemUpdate`. */
const gaps = (policies: readonly PolicyRow[], systemUpdate = false): string[] =>
  policyGaps(
    "notes.notes",
    "notes",
    "owner_id",
    "app.owner_id",
    policies,
    ["id", "owner_id", "kind"],
    systemUpdate,
  );

describe("policyGaps", () => {
  it("passes the owner equality beside a restrictive policy named after its column", () => {
    expect(gaps([OWNER, KIND])).toEqual([]);
    expect(gaps([{ ...OWNER, check: EQUALITY }])).toEqual([]);
  });

  it("reports a missing owner policy", () => {
    expect(gaps([KIND])).toEqual(["notes.notes has no policy pol_notes_owner_id"]);
  });

  it("reports an owner policy that is restrictive, per command or not the equality", () => {
    for (const policy of [
      { ...OWNER, permissive: false },
      { ...OWNER, command: "r" },
      { ...OWNER, using: "true" },
      { ...OWNER, check: "true" },
    ])
      expect(gaps([policy])).toEqual([
        "notes.notes: pol_notes_owner_id is not the owner equality, a permissive FOR ALL policy testing owner_id against app.owner_id",
      ]);
  });

  it("reports a second permissive policy and a restrictive policy not named after a column", () => {
    expect(gaps([OWNER, { ...KIND, permissive: true }, { ...KIND, name: "narrow" }])).toEqual([
      "notes.notes: pol_notes_kind is a second permissive policy, which widens pol_notes_owner_id; only a restrictive policy may narrow it",
      "notes.notes: restrictive policy narrow is not named pol_notes_<column> after a column it tests",
    ]);
  });

  describe("the platform form (ADR 0239 amendment, gap C)", () => {
    const own =
      "(NOT ((owner_id)::text IS DISTINCT FROM current_setting('app.owner_id'::text, true)))";
    const PLATFORM: PolicyRow = {
      ...OWNER,
      using: `(${EQUALITY} OR (owner_id IS NULL))`,
      check: own,
    };
    const write = (command: string, suffix: string): PolicyRow => ({
      name: `pol_notes_owner_id_write_${suffix}`,
      permissive: false,
      command,
      using: own,
      check: "",
    });
    const UPDATE = write("w", "update");
    const DELETE = write("d", "delete");

    it("passes the owner policy with its two restrictive write policies", () => {
      expect(gaps([PLATFORM, UPDATE, DELETE, KIND])).toEqual([]);
    });

    it("reports a missing, permissive or other-command write policy", () => {
      expect(gaps([PLATFORM, UPDATE])).toEqual([need("delete", "DELETE")]);
      expect(gaps([PLATFORM, UPDATE, { ...DELETE, command: "w" }])).toEqual([
        need("delete", "DELETE"),
      ]);
      expect(gaps([PLATFORM, { ...UPDATE, permissive: true }, DELETE])).toEqual([
        need("update", "UPDATE"),
        "notes.notes: pol_notes_owner_id_write_update is a second permissive policy, which widens pol_notes_owner_id; only a restrictive policy may narrow it",
      ]);
    });

    it("lets the system-access role through _write_update only when the table declares system update", () => {
      const LIFTED = {
        ...UPDATE,
        using: `(${own} OR (CURRENT_USER = 'stackra_system_access'::name))`,
      };
      expect(gaps([PLATFORM, LIFTED, DELETE], true)).toEqual([]);
      expect(gaps([PLATFORM, UPDATE, DELETE], true)).toEqual([
        "notes.notes: pol_notes_owner_id_write_update must also pass stackra_system_access (… or current_user = 'stackra_system_access'), as the table declares t.systemAccess update columns; without it a claim reaches only the NULL rows. Declare both in one blueprint",
      ]);
      expect(gaps([PLATFORM, LIFTED, DELETE], false)).toEqual([
        "notes.notes: pol_notes_owner_id_write_update does not test what pol_notes_owner_id_write_delete does; it passes stackra_system_access, though the table declares no t.systemAccess update column",
      ]);
      // Any other widening is refused either way.
      const widened = { ...UPDATE, using: `(${own} OR (CURRENT_USER = 'someone'::name))` };
      expect(gaps([PLATFORM, widened, DELETE], true)).toHaveLength(1);
      expect(gaps([PLATFORM, widened, DELETE], false)).toEqual([
        "notes.notes: pol_notes_owner_id_write_update does not test what pol_notes_owner_id_write_delete does",
      ]);
    });

    it("accepts the write policies' names only beside a platform-form owner policy", () => {
      expect(gaps([OWNER, UPDATE])).toEqual([
        "notes.notes: restrictive policy pol_notes_owner_id_write_update is not named pol_notes_<column> after a column it tests",
      ]);
    });
  });
});
