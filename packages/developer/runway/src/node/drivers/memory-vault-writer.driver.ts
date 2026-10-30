/**
 * Stackra file contract:
 * Purpose: `MemoryVaultWriterDriver`, the in-memory driver of the `VaultWriter` port: records `<path>/<name>` of each
 *          write and keeps no value.
 * Boundary: calls nothing outside the process; a value is dropped as soon as it arrives.
 * Runtime: node
 * Governing contract: ADR 0482 (decision 7), ADR 0173.
 */
import { Driver } from "@stackra/container";

import { VaultWriter } from "#core/ports/vault-writer.port";

/**
 * A vault that remembers names only.
 *
 * @example
 * const vault = new MemoryVaultWriterDriver();
 * vault.names; // ["prod:/ci/store/academorix/FCM_SERVICE_ACCOUNT_JSON"]
 */
export class MemoryVaultWriterDriver extends Driver(VaultWriter) {
  /** `<path>/<name>` of every write, in order. */
  readonly names: string[] = [];

  /** Records the name. */
  override async write(path: string, name: string): Promise<void> {
    this.names.push(`${path}/${name}`);
  }
}
