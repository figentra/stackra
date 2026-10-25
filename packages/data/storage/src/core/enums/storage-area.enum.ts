/**
 * Stackra file contract:
 * Purpose: `StorageArea`, the six named areas of client storage (ADR 0256 decision 2): where a persisted store, a
 *          config field (`StateConfig.persistStore`) or a package says a value goes.
 * Boundary: an `Enum.of` value plus the type of the same name. Each code is also the property of the `Storage` port
 *           that holds the area, so `storage[area]` reads it; a new area is an ADR change and a new port property.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decision 2), ADR 0294 (decision 16: the Enum row), ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The named areas of the `Storage` port. */
export const StorageArea = Enum.of({
  /** Per-install preferences and persisted client state. */
  Prefs: "prefs",
  /** The current session only. */
  Session: "session",
  /** Disposable cached data. */
  Cache: "cache",
  /** The offline queue. */
  Outbox: "outbox",
  /** Secrets, only where the platform protects them. */
  Secrets: "secrets",
  /** File references and small payloads. */
  Files: "files",
});

/** One of the codes above. */
export type StorageArea = Enum.Value<typeof StorageArea>;
