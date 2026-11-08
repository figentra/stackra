/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryVaultWriterDriver`: each write records `<path>/<name>` in order and the value is kept
 *          nowhere on the driver.
 * Boundary: test only; in memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0482 (decision 7), ADR 0173.
 */
import { describe, expect, it } from "@stackra/testing";

import type { VaultWriter } from "#core/ports/vault-writer.port";
import { MemoryVaultWriterDriver } from "#node/drivers/memory-vault-writer.driver";

describe("MemoryVaultWriterDriver", () => {
  it("records names only, in order", async () => {
    const vault = new MemoryVaultWriterDriver();
    // through the port, as callers hand it the value the driver must not keep
    const writer: VaultWriter = vault;

    await writer.write("prod:/ci/store/acme", "FCM_SERVICE_ACCOUNT_JSON", "canary-value-1");
    await writer.write("prod:/ci/store/acme", "ASC_API_KEY", "canary-value-2");

    expect(vault.names).toEqual([
      "prod:/ci/store/acme/FCM_SERVICE_ACCOUNT_JSON",
      "prod:/ci/store/acme/ASC_API_KEY",
    ]);
    expect(JSON.stringify(vault)).not.toContain("canary-value");
  });
});
