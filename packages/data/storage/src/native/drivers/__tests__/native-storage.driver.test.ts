/**
 * Stackra file contract:
 * Purpose: unit tests of `NativeStorageDriver`: it is a `Storage`, opens one MMKV instance per non-secret area under
 *          `stackra.<area>`, persists those areas across drivers, keeps `secrets` in secure store with an index of its
 *          keys, and forgets a removed secret from both the value and the index.
 * Boundary: test only; react-native-mmkv and expo-secure-store are replaced by in-memory fakes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0256 (decisions 2 to 4).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

const mocks = vi.hoisted(() => {
  const instances = new Map<string, Map<string, string>>();
  const secure = new Map<string, string>();
  return {
    instances,
    secure,
    createMMKV: (options: { id: string }) => {
      const items = instances.get(options.id) ?? new Map<string, string>();
      instances.set(options.id, items);
      return {
        getAllKeys: () => [...items.keys()],
        getString: (key: string) => items.get(key),
        set: (key: string, value: string) => void items.set(key, value),
        remove: (key: string) => items.delete(key),
      };
    },
  };
});

vi.mock("react-native-mmkv", () => ({ createMMKV: mocks.createMMKV }));
vi.mock("expo-secure-store", () => ({
  getItemAsync: async (key: string) => mocks.secure.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => void mocks.secure.set(key, value),
  deleteItemAsync: async (key: string) => void mocks.secure.delete(key),
}));

import { Storage } from "#contracts/ports/storage.port";
import { NativeStorageDriver } from "#native/drivers/native-storage.driver";

beforeEach(() => {
  mocks.instances.clear();
  mocks.secure.clear();
});

describe("NativeStorageDriver", () => {
  it("is a Storage", () => {
    expect(new NativeStorageDriver()).toBeInstanceOf(Storage);
  });

  it("opens one MMKV instance per area but secrets", () => {
    expect(new NativeStorageDriver()).toBeInstanceOf(Storage);
    expect([...mocks.instances.keys()].sort()).toEqual([
      "stackra.cache",
      "stackra.files",
      "stackra.outbox",
      "stackra.prefs",
      "stackra.session",
    ]);
  });

  it("keeps prefs in MMKV across drivers", async () => {
    const first = new NativeStorageDriver();
    first.prefs.set("mobile.preferences", { theme: "dark" });
    await first.flush();
    expect(mocks.instances.get("stackra.prefs")?.get("mobile.preferences")).toBe(
      '{"v":{"theme":"dark"}}',
    );
    const second = new NativeStorageDriver();
    await second.hydrate();
    expect(second.prefs.get("mobile.preferences")).toEqual({ theme: "dark" });
  });

  it("keeps secrets in secure store with an index, and forgets a removed one", async () => {
    const first = new NativeStorageDriver();
    first.secrets.set("auth.token", "abc");
    first.secrets.set("auth.refresh", "def");
    await first.flush();
    expect(mocks.secure.get("stackra.secrets.index")).toBe('["auth.token","auth.refresh"]');
    const second = new NativeStorageDriver();
    await second.hydrate();
    expect(second.secrets.get("auth.token")).toBe("abc");
    second.secrets.delete("auth.token");
    await second.flush();
    expect(mocks.secure.has("stackra.secrets.auth.token")).toBe(false);
    expect(mocks.secure.get("stackra.secrets.index")).toBe('["auth.refresh"]');
  });
});
