/**
 * Stackra file contract:
 * Purpose: unit tests of `driverName`: the file stem without the port's kebab name, or the whole stem.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { driverName } from "#core/functions/driver-name.function";

describe("driverName", () => {
  it("strips the port name from the stem", () => {
    expect(driverName("src/node/drivers/postgres-loyalty-ledger.driver.ts", "LoyaltyLedger")).toBe(
      "postgres",
    );
    expect(driverName("memory-loyalty-ledger.driver.ts", "LoyaltyLedger")).toBe("memory");
  });

  it("keeps a stem that does not end in the port name", () => {
    expect(driverName("src/core/drivers/resend.driver.ts", "MailTransport")).toBe("resend");
    expect(driverName("loyalty-ledger.driver.ts", "LoyaltyLedger")).toBe("loyalty-ledger");
  });
});
