/**
 * Stackra file contract:
 * Purpose: unit tests of `ITEMS_LOCK_SCHEMA` and `ITEM_PACKAGE_NAME_PATTERN`: a valid lock parses; a package name
 *          without its kind prefix, a package kind, a non-sha512 integrity, a target outside the workspace and an
 *          unknown key are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 11).
 */
import { describe, expect, it } from "@stackra/testing";

import { ITEM_PACKAGE_NAME_PATTERN } from "#contracts/constants/item-package-name-pattern.constant";
import { ITEMS_LOCK_SCHEMA } from "#contracts/constants/items-lock-schema.constant";

const entry = {
  kind: "skill",
  version: "0.1.0",
  integrity: "sha512-AAAA==",
  target: ".agents/skills/archify",
};
const lock = (name: string, item: Record<string, unknown>) => ({
  lockfileVersion: 1,
  items: { [name]: item },
});

describe("ITEM_PACKAGE_NAME_PATTERN", () => {
  it("names scope, kind and name", () => {
    expect(ITEM_PACKAGE_NAME_PATTERN.exec("@stackra-pro/mcp-github")?.groups).toEqual({
      scope: "stackra-pro",
      kind: "mcp",
      name: "github",
    });
    expect(ITEM_PACKAGE_NAME_PATTERN.test("@stackra/cli")).toBe(false);
    expect(ITEM_PACKAGE_NAME_PATTERN.test("@stackra/package-cli")).toBe(false);
  });
});

describe("ITEMS_LOCK_SCHEMA", () => {
  it("parses a lock", () => {
    expect(ITEMS_LOCK_SCHEMA.parse(lock("@stackra/skill-archify", entry))).toEqual(
      lock("@stackra/skill-archify", entry),
    );
  });

  it("refuses what is not an installed item", () => {
    for (const bad of [
      lock("@stackra/archify", entry),
      lock("@stackra/skill-archify", { ...entry, kind: "package" }),
      lock("@stackra/skill-archify", { ...entry, integrity: "sha1-abc" }),
      lock("@stackra/skill-archify", { ...entry, target: "../outside" }),
      lock("@stackra/skill-archify", { ...entry, target: "/etc" }),
      lock("@stackra/skill-archify", { ...entry, extra: true }),
      { ...lock("@stackra/skill-archify", entry), lockfileVersion: 2 },
    ]) {
      expect(ITEMS_LOCK_SCHEMA.safeParse(bad).success).toBe(false);
    }
  });
});
