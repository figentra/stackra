/**
 * Stackra file contract:
 * Purpose: unit tests of `entryOf`: `src/config` and `src/core` (and a file directly in `src/`) are `index`, the
 *          entry folders are their own entries, factories and seeders are `testing`, and any other folder has none.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15); ADR 0127 2026-10-24 note.
 */
import { describe, expect, it } from "@stackra/testing";

import { entryOf } from "#core/functions/entry-of.function";

describe("entryOf", () => {
  it("places config and core in the `.` entry", () => {
    expect(entryOf("src/config/loyalty-kit.config.ts")).toBe("index");
    expect(entryOf("src/core/services/loyalty.service.ts")).toBe("index");
    expect(entryOf("src/main.ts")).toBe("index");
  });

  it("places each entry folder in its own entry, and factories and seeders in testing", () => {
    expect(entryOf("src/contracts/ports/members.port.ts")).toBe("contracts");
    expect(entryOf("src/node/actions/redeem-points.action.ts")).toBe("node");
    expect(entryOf("src/react/points-balance/points-balance.tsx")).toBe("react");
    expect(entryOf("src/native/points-balance/points-balance.tsx")).toBe("native");
    expect(entryOf("src/testing/loyalty-members.fake.ts")).toBe("testing");
    expect(entryOf("src/node/database/seeders/demo.seeder.ts")).toBe("testing");
    expect(entryOf("src/node/database/factories/account.factory.ts")).toBe("testing");
  });

  it("gives a file outside the entry folders no entry", () => {
    expect(entryOf("src/modules/orders/actions/cancel-order.action.ts")).toBeUndefined();
  });
});
