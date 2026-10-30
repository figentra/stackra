/**
 * Stackra file contract:
 * Purpose: proves `localStorageLayoutPort`: it loads null when nothing is saved, saves a layout as JSON under its key
 *          and loads it back, and never throws: a corrupt value, a storage that refuses access, a full storage and a
 *          browser with no storage all load null or drop the save.
 * Boundary: jsdom's `localStorage`; refusing storage is a stand-in that throws.
 * Runtime: browser
 * Governing contract: ADR 0307 (decisions 16 and 18); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import type { DashboardLayout } from "#contracts/types/dashboard-layout.type";
import { localStorageLayoutPort } from "#react/dashboard-grid/local-storage-layout-port.function";

const LAYOUT: DashboardLayout = [
  { id: "sales", size: "large" },
  { id: "orders", size: "small" },
];

/** A storage whose every call throws, as a blocked one does. */
const refusing = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

describe("localStorageLayoutPort (web)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads nothing before a save, then the saved layout under its own key", async () => {
    const port = localStorageLayoutPort("sales-dashboard");
    expect(await port.load()).toBeNull();
    await port.save(LAYOUT);
    expect(localStorage.getItem("sales-dashboard")).toBe(JSON.stringify(LAYOUT));
    expect(await port.load()).toEqual(LAYOUT);
    expect(await localStorageLayoutPort("other").load()).toBeNull();
  });

  it("loads null from a corrupt value", async () => {
    localStorage.setItem("sales-dashboard", "{not json");
    expect(await localStorageLayoutPort("sales-dashboard").load()).toBeNull();
  });

  it("loads null and drops the save when storage refuses access", async () => {
    vi.stubGlobal("localStorage", refusing);
    const port = localStorageLayoutPort("sales-dashboard");
    expect(await port.load()).toBeNull();
    await expect(port.save(LAYOUT)).resolves.toBeUndefined();
  });

  it("works where there is no storage at all", async () => {
    vi.stubGlobal("localStorage", undefined);
    const port = localStorageLayoutPort("sales-dashboard");
    expect(await port.load()).toBeNull();
    await expect(port.save(LAYOUT)).resolves.toBeUndefined();
  });
});
