/**
 * Stackra file contract:
 * Purpose: the KeyProvider port: hands out the data keys of envelope encryption, the current one to seal with and any
 *          earlier one by id to open with.
 * Boundary: an abstract class that is its own token; the memory, AWS KMS (per tenant) and per-subject drivers ship
 *           here. It never lists keys.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17), ADR 0173 (nobody reads a value); registry gaps R-27 and R-36
 *                     (owner decision 23).
 */
import { Port } from "#core/bases/port.base";
import type { DataKey } from "#core/types/data-key.type";

/** Provides data keys for envelope encryption. */
export abstract class KeyProvider extends Port {
  // No `~key` brand: products ship their own drivers (os audit), so the member's generated wiring is the one declarer
  // of this port's names, and a package's narrower `DriverRegistry` entry would clash with it (TS2717, STA-2693).

  /** The key new data is sealed with. */
  abstract current(): Promise<DataKey>;

  /**
   * The key with this id, for opening data sealed before a rotation.
   *
   * @throws when no key has the id.
   */
  abstract byId(id: string): Promise<DataKey>;
}
