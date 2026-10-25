/**
 * Stackra file contract:
 * Purpose: `Store`, the kind base of a client state class, in both forms: `extends Store` for session-only state,
 *          `extends Store({ persist })` for state persisted into a storage area. The fields are the state, `set` is the
 *          only writer and the class's own methods its only callers, getters are derived values. The interface of the
 *          same name is its instance side.
 * Boundary: the class is a singleton binding the container builds with the client storage (`@stackra/storage`'s
 *           `Storage`, structurally a `StoreStorage`). A persisted store's key is derived and registered by gen
 *           (`registerStores`); the constructor opens the area (and its cross-tab channel), and hydration runs on a microtask, after the
 *           subclass's field initializers. Bookkeeping lives outside the instance, so a spread of a store is exactly its
 *           state. Nothing server-owned belongs here (ADR 0079 decision 2).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25); ADR 0079 as amended by 0294; ADR 0256; ADR 0305 (rule 3).
 */
import { createKind, kindOf } from "@stackra/container";

import { STORE_INTERNALS } from "#core/constants/store-internals.constant";
import { commitStore } from "#core/functions/commit-store.function";
import { hydrateStore } from "#core/functions/hydrate-store.function";
import { internalsOf } from "#core/functions/internals-of.function";
import { openStoreChannel } from "#core/functions/open-store-channel.function";
import { storeKeyOf } from "#core/functions/store-key-of.function";
import type { StoreClass } from "#core/types/store-class.type";
import type { StoreOptions } from "#core/types/store-options.type";
import type { StorePatch } from "#core/types/store-patch.type";
import type { StoreInternals } from "#core/types/store-internals.type";
import type { StoreStorage } from "#core/types/store-storage.type";

/** The runtime base every store class extends. */
class StoreBase {
  /**
   * Opens the declared storage area when the class persists and storage is given; otherwise the store lives in memory.
   *
   * @throws TypeError when the class persists into storage but gen registered no key for it.
   */
  constructor(storage?: StoreStorage) {
    const persist = (kindOf(new.target)?.options as Partial<StoreOptions> | undefined)?.persist;
    const area = persist === undefined || storage === undefined ? undefined : storage.area(persist);
    const internals: StoreInternals = {
      area,
      key: area === undefined ? undefined : storeKeyOf(new.target),
      listeners: new Set(),
      written: new Set(),
      version: 0,
      channel: undefined,
      hydration: false,
    };
    STORE_INTERNALS.set(this, internals);
    if (persist !== undefined && area !== undefined)
      internals.channel = openStoreChannel(this, internals, persist);
    queueMicrotask(() => void hydrateStore(this));
  }

  /**
   * Changes fields of the state, persists it and notifies subscribers; a patch that changes nothing does neither.
   *
   * @throws TypeError when the patch names something that is not a field of the store.
   * @example
   * toggleSidebar(): void {
   *   this.set({ sidebarCollapsed: !this.sidebarCollapsed });
   * }
   */
  protected set(patch: StorePatch<this>): void {
    const internals = internalsOf(this);
    const fields = this as unknown as Record<string, unknown>;
    let changed = false;
    for (const [field, value] of Object.entries(
      typeof patch === "function" ? patch(this) : patch,
    )) {
      if (!Object.hasOwn(this, field) || typeof fields[field] === "function")
        throw new TypeError(`${this.constructor.name} has no state field "${field}"`);
      internals.written.add(field);
      if (Object.is(fields[field], value)) continue;
      fields[field] = value;
      changed = true;
    }
    if (changed) commitStore(this);
  }
}

/** The instance side every store shares. */
export interface Store extends StoreBase {
  /** Type-only kind brand, so a class of another kind cannot stand in for a store. */
  readonly "~kind": "store";
}

/**
 * The store kind base.
 *
 * @example
 * export class UiStore extends Store({ persist: StorageArea.Prefs }) {
 *   sidebarCollapsed = false;
 *
 *   toggleSidebar(): void {
 *     this.set({ sidebarCollapsed: !this.sidebarCollapsed });
 *   }
 * }
 *
 * export class PaletteStore extends Store {
 *   isOpen = false;
 * }
 */
export const Store = createKind("store", StoreBase) as StoreClass &
  ((options: StoreOptions) => StoreClass);
