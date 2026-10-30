/**
 * Stackra file contract:
 * Purpose: the `VaultWriter` port: writes one generated secret into the vault by path and name, blind.
 * Boundary: an abstract class that is its own token; the Infisical driver writes through Infisical's API with the
 *           job's OIDC session, the memory driver records names only. It reads and lists nothing, so no caller can
 *           get a value back (ADR 0173: nobody reads a value).
 * Runtime: isomorphic
 * Governing contract: ADR 0482 (decision 7), ADR 0173, ADR 0257, ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

/** Where generated secrets go. */
export abstract class VaultWriter extends Port {
  /** Writes `value` as the secret `name` at `path` (`prod:/ci/store/academorix`), creating or replacing it. */
  abstract write(path: string, name: string, value: string): Promise<void>;
}
