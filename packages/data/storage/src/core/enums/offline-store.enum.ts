/**
 * Stackra file contract:
 * Purpose: `OfflineStore`, where a target keeps the persisted query cache and the offline queue: the value of a
 *          platform config field (`DesktopConfig.offlineStore`) that the query persister's driver choice reads.
 * Boundary: an `Enum.of` value plus the type of the same name; it names a place, the drivers that use it live with
 *           their packages (the query persister, this package's platform drivers). The web default is encrypted with a
 *           non-extractable WebCrypto key (ADR 0256 owner default).
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decision 3 and the web offline encryption default), ADR 0294 (decision 16), ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** Where the persisted query cache and the offline queue live. */
export const OfflineStore = Enum.of({
  /** IndexedDB encrypted with a non-extractable WebCrypto key: web, PWA, and desktop with the key in `safeStorage`. */
  EncryptedIndexedDb: "encrypted_indexed_db",
  /** SQLite on the device: native. */
  Sqlite: "sqlite",
  /** Memory only: nothing survives a reload (tests, a kiosk that must keep nothing). */
  Memory: "memory",
});

/** One of the codes above. */
export type OfflineStore = Enum.Value<typeof OfflineStore>;
