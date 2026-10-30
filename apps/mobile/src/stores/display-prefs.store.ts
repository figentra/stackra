/**
 * Stackra file contract:
 * Purpose: `displayPrefs`, the app's remembered display settings (colour scheme, language, digits, brand, transition
 *          preset, haptics, the last landing hero) as short strings in one MMKV instance (`stackra.showcase`), read
 *          synchronously at launch, and `restoreDisplayPrefs`'s home for the stores it feeds.
 * Boundary: strings in, strings out; never throws. `react-native-mmkv` is loaded on first use: where it is missing or
 *           not linked (a dev client built before it, a test) the values live in memory for this launch only.
 * Runtime: react-native
 * Governing contract: ADR 0256 (client storage); ADR 0320 (the Theme Studio).
 */
import type * as Mmkv from "react-native-mmkv";

import type { DisplayPrefKey } from "./display-pref-key.type";

/** The backend: MMKV, or a Map where MMKV cannot load. */
type Backend = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
};

let backend: Backend | undefined;

/** The MMKV instance, or a Map stand-in where the native module cannot load. */
function load(): Backend {
  if (backend) return backend;
  try {
    // shortcut: MMKV directly, not @stackra/storage, until the app boots the storage container (ADR 0256).
    // oxlint-disable-next-line typescript/no-require-imports -- required on first use, so an app or a test without the native module still runs
    const { createMMKV } = require("react-native-mmkv") as typeof Mmkv;
    backend = createMMKV({ id: "stackra.showcase" });
  } catch {
    const memory = new Map<string, string>();
    backend = {
      getString: (key) => memory.get(key),
      set: (key, value) => void memory.set(key, value),
    };
  }
  return backend;
}

/** The remembered display settings. */
export const displayPrefs = Object.freeze({
  /** The stored value of `key`, or `undefined`. */
  get(key: DisplayPrefKey): string | undefined {
    try {
      return load().getString(key);
    } catch {
      return undefined;
    }
  },
  /** Remembers `value` under `key`. */
  set(key: DisplayPrefKey, value: string): void {
    try {
      load().set(key, value);
    } catch {
      // A failed write keeps the setting for this launch only; it never breaks the switch.
    }
  },
});
