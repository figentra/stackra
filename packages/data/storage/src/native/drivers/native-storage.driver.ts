/**
 * Stackra file contract:
 * Purpose: `NativeStorageDriver`, the `Storage` driver of the mobile targets: `prefs`, `session`, `cache`, `outbox` and
 *          `files` persist in react-native-mmkv, one MMKV instance per area (`stackra.<area>`), and `secrets` in
 *          expo-secure-store, the iOS keychain and the Android keystore.
 * Boundary: React Native only; both modules are optional peers, loaded when the container builds the driver. MMKV is
 *           synchronous, so those areas are readable at once. Secure store has no key listing, so the secrets area keeps
 *           its key names in one index entry (`stackra.secrets.index`) beside the values (`stackra.secrets.<key>`); the
 *           area serializes backend calls, so the index never races itself. Secret keys must fit secure store's
 *           alphabet (letters, digits, `.`, `-`, `_`), which the derived storage keys do. `session` persists like
 *           the other MMKV areas: the session's end clears it.
 * Runtime: react-native
 * Governing contract: ADR 0256 (decisions 2 to 4); ADR 0127 2026-10-24 note (a `./native` entry for device drivers).
 */
import * as SecureStore from "expo-secure-store";
import { createMMKV } from "react-native-mmkv";

import { AreaStorageDriver } from "#core/drivers/area-storage.driver";
import { StorageArea } from "#core/enums/storage-area.enum";
import type { StorageBackend } from "#core/types/storage-backend.type";

/** The secure-store entry that lists the secrets' keys. */
const SECRETS_INDEX = "stackra.secrets.index";

/** A backend over the MMKV instance `stackra.<area>`. */
function mmkvBackend(area: StorageArea): StorageBackend {
  const mmkv = createMMKV({ id: `stackra.${area}` });
  return {
    load() {
      const loaded: [string, string][] = [];
      for (const key of mmkv.getAllKeys()) {
        const text = mmkv.getString(key);
        if (text !== undefined) loaded.push([key, text]);
      }
      return loaded;
    },
    save: (key, text) => mmkv.set(key, text),
    remove: (key) => {
      mmkv.remove(key);
    },
  };
}

/** A backend over the keychain or keystore. */
function secureStoreBackend(): StorageBackend {
  const readIndex = async (): Promise<string[]> => {
    const text = await SecureStore.getItemAsync(SECRETS_INDEX);
    return text === null ? [] : (JSON.parse(text) as string[]);
  };
  const writeIndex = (keys: string[]): Promise<void> =>
    SecureStore.setItemAsync(SECRETS_INDEX, JSON.stringify(keys));
  return {
    async load() {
      const loaded: [string, string][] = [];
      for (const key of await readIndex()) {
        const text = await SecureStore.getItemAsync(`stackra.secrets.${key}`);
        if (text !== null) loaded.push([key, text]);
      }
      return loaded;
    },
    async save(key, text) {
      await SecureStore.setItemAsync(`stackra.secrets.${key}`, text);
      const keys = await readIndex();
      if (!keys.includes(key)) await writeIndex([...keys, key]);
    },
    async remove(key) {
      await SecureStore.deleteItemAsync(`stackra.secrets.${key}`);
      const keys = await readIndex();
      if (keys.includes(key)) await writeIndex(keys.filter((kept) => kept !== key));
    },
  };
}

/**
 * Storage on a phone.
 *
 * @example
 * drivers: [{ port: Storage, candidates: { native: () => import("@stackra/storage/native").then((m) => m.NativeStorageDriver) } }]
 */
export class NativeStorageDriver extends AreaStorageDriver {
  /** Opens the five MMKV instances once, when the container builds the driver. */
  constructor() {
    super({
      prefs: mmkvBackend(StorageArea.Prefs),
      session: mmkvBackend(StorageArea.Session),
      cache: mmkvBackend(StorageArea.Cache),
      outbox: mmkvBackend(StorageArea.Outbox),
      files: mmkvBackend(StorageArea.Files),
      secrets: secureStoreBackend(),
    });
  }
}
