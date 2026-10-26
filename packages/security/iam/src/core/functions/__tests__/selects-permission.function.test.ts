/**
 * Stackra file contract:
 * Purpose: unit tests of `selectsPermission`: `@read` picks registered L0 and L1 permissions, `@risk:<level>` picks
 *          that level, a prefix narrows both by whole segments, system and restricted permissions are never picked
 *          for a grant but are for a deny, and an unregistered key or a malformed selector picks nothing.
 * Boundary: test only; registers its own fixture permission set.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0132; ADR 0407; STA-818.
 */
import { describe, expect, it } from "@stackra/testing";

import { Permissions } from "#core/bases/permissions.base";
import { registerPermissions } from "#core/functions/register-permissions.function";
import { selectsPermission } from "#core/functions/selects-permission.function";
import { Permission } from "#core/values/permission.value";

class LedgerPermissions extends Permissions {
  static readonly view = Permission.L0;
  static readonly read = Permission.L1;
  static readonly adjust = Permission.L2;
  static readonly refund = Permission.L3;
  static readonly purge = Permission.L4;
  static readonly expire = Permission.L2.system();
  static readonly readMedical = Permission.L1.restricted();
}

registerPermissions([
  {
    type: LedgerPermissions,
    keys: {
      view: "selector_fixture.ledger.view",
      read: "selector_fixture.ledger.read",
      adjust: "selector_fixture.ledger.adjust",
      refund: "selector_fixture.ledger.refund",
      purge: "selector_fixture.ledger.purge",
      expire: "selector_fixture.ledger.expire",
      readMedical: "selector_fixture.ledger.read_medical",
    },
  },
]);

describe(selectsPermission, () => {
  it("picks every read by kind and every permission at one risk", () => {
    expect(selectsPermission("@read", "selector_fixture.ledger.view")).toBe(true);
    expect(selectsPermission("@read", "selector_fixture.ledger.read")).toBe(true);
    expect(selectsPermission("@read", "selector_fixture.ledger.adjust")).toBe(false);
    expect(selectsPermission("@risk:l3", "selector_fixture.ledger.refund")).toBe(true);
    expect(selectsPermission("@risk:l3", "selector_fixture.ledger.purge")).toBe(false);
  });

  it("narrows by a whole-segment prefix", () => {
    expect(selectsPermission("selector_fixture.@read", "selector_fixture.ledger.read")).toBe(true);
    expect(
      selectsPermission("selector_fixture.ledger.@risk:l4", "selector_fixture.ledger.purge"),
    ).toBe(true);
    expect(selectsPermission("selector.@read", "selector_fixture.ledger.read")).toBe(false);
  });

  it("never grants a system or restricted permission, but a deny picks them", () => {
    expect(selectsPermission("@risk:l2", "selector_fixture.ledger.expire")).toBe(false);
    expect(selectsPermission("@read", "selector_fixture.ledger.read_medical")).toBe(false);
    expect(selectsPermission("@risk:l2", "selector_fixture.ledger.expire", true)).toBe(true);
    expect(selectsPermission("@read", "selector_fixture.ledger.read_medical", true)).toBe(true);
  });

  it("picks nothing for an unregistered key or a malformed selector", () => {
    expect(selectsPermission("@read", "selector_fixture.ledger.unknown")).toBe(false);
    expect(selectsPermission("@write", "selector_fixture.ledger.adjust")).toBe(false);
    expect(selectsPermission("@risk:l9", "selector_fixture.ledger.adjust")).toBe(false);
    expect(selectsPermission("Orders.@read", "selector_fixture.ledger.read")).toBe(false);
  });
});
