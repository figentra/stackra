/**
 * Stackra file contract:
 * Purpose: unit tests of `evictShell`: the function the page evaluates deletes every cached request whose path ends in `/index.html`, in every
 *          cache, and keeps the rest.
 * Boundary: test only; the page runs the evaluated function against a fake `caches` store.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import type { Page } from "@playwright/test";
import { vi } from "vitest";

import { evictShell } from "#e2e/evict-shell/evict-shell.function";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Two caches holding requests by URL; `deleted` lists what was removed, as `cache:url`. */
function fakeCaches(contents: Record<string, string[]>) {
  const deleted: string[] = [];
  const store = {
    keys: async () => Object.keys(contents),
    open: async (name: string) => ({
      keys: async () => (contents[name] ?? []).map((url) => ({ url })),
      delete: async (request: { url: string }) => {
        deleted.push(`${name}:${request.url}`);
        return true;
      },
    }),
  };
  return { store, deleted };
}

describe("evictShell", () => {
  it("deletes the index.html entries of every cache and keeps the other requests", async () => {
    const { store, deleted } = fakeCaches({
      shell: ["https://app.test/index.html", "https://app.test/assets/app.js"],
      pages: ["https://app.test/ar-sa/index.html", "https://app.test/offline/"],
    });
    vi.stubGlobal("caches", store);
    const page = { evaluate: vi.fn(async (run: () => Promise<void>) => run()) } as unknown as Page;
    await evictShell(page);
    expect(deleted).toEqual([
      "shell:https://app.test/index.html",
      "pages:https://app.test/ar-sa/index.html",
    ]);
  });

  it("deletes nothing when no cache holds a shell", async () => {
    const { store, deleted } = fakeCaches({ shell: ["https://app.test/assets/app.js"] });
    vi.stubGlobal("caches", store);
    const page = { evaluate: vi.fn(async (run: () => Promise<void>) => run()) } as unknown as Page;
    await evictShell(page);
    expect(deleted).toEqual([]);
  });
});
