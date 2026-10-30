/**
 * Stackra file contract:
 * Purpose: proves the native loadClipboard: with no linked `ExpoClipboard` native module it gives `null` without
 *          requiring the package, and with one linked it never throws, giving the module or `null`.
 * Boundary: the function only; `globalThis.expo` is stubbed per test and no native module runs.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement).
 */
import { loadClipboard } from "#native/copy-button/load-clipboard.function";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadClipboard (native)", () => {
  it("gives null where the native module is not linked", () => {
    vi.stubGlobal("expo", undefined);
    expect(loadClipboard()).toBeNull();
    vi.stubGlobal("expo", { modules: {} });
    expect(loadClipboard()).toBeNull();
  });

  it("never throws where the native module is linked", () => {
    vi.stubGlobal("expo", { modules: { ExpoClipboard: {} } });
    const clipboard = loadClipboard();
    expect(clipboard === null || typeof clipboard.setStringAsync === "function").toBe(true);
  });
});
