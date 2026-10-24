/**
 * Stackra file contract:
 * Purpose: unit tests of `fileKind`: simple and hyphenated kinds, numbered migrations, and the names that carry no
 *          class kind (tests, components, plain files).
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, it } from "@stackra/testing";

import { fileKind } from "#core/functions/file-kind.function";

describe("fileKind", () => {
  it.each([
    ["src/modules/orders/actions/cancel-order.action.ts", "action"],
    ["src/modules/orders/extensions/order.extension-point.ts", "extension-point"],
    ["src/modules/orders/models/order.state-machine.ts", "state-machine"],
    ["src/modules/orders/database/migrations/0001-create-orders.migration.ts", "migration"],
    ["src/node/orders.module.ts", "module"],
  ])("fileKind(%j) is %j", (filename, expected) => {
    expect(fileKind(filename)).toBe(expected);
  });

  it.each([
    "src/modules/orders/actions/__tests__/cancel-order.action.test.ts",
    "src/routes/home/home.route.tsx",
    "src/main.ts",
    "README.md",
  ])("fileKind(%j) is undefined", (filename) => {
    expect(fileKind(filename)).toBeUndefined();
  });
});
