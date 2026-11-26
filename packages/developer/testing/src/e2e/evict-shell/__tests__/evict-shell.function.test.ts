/**
 * Stackra file contract:
 * Purpose: unit tests of `evictShell`: the script it runs in the page deletes every cached `index.html` from every
 *          Cache Storage cache and keeps every other entry.
 * Boundary: test only; the page is a stub whose `evaluate` runs the script here against a fake `caches`, so no
 *           browser runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 6); ADR 0182 (decision 2: coverage floors).
 */
import type { Page } from "@playwright/test";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { evictShell } from "#e2e/evict-shell/evict-shell.function";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** A Cache Storage with the given URLs per cache name, recording deletions. */
function fakeCaches(entries: Record<string, string[]>): { deleted: string[] } {
  const deleted: string[] = [];
  vi.stubGlobal("caches", {
    keys: async () => Object.keys(entries),
    open: async (name: string) => ({
      keys: async () => (entries[name] ?? []).map((url) => ({ url })),
      delete: async (request: { url: string }) => {
        deleted.push(request.url);
        return true;
      },
    }),
  });
  return { deleted };
}

describe("evictShell", () => {
  it("deletes each cached index.html and keeps every other entry", async () => {
    const { deleted } = fakeCaches({
      shell: ["https://app.test/index.html", "https://app.test/assets/a.js"],
      pages: ["https://app.test/orders/index.html?v=2", "https://app.test/orders"],
    });
    const page = { evaluate: async (script: () => Promise<void>) => script() } as unknown as Page;
    await evictShell(page);
    expect(deleted).toEqual([
      "https://app.test/index.html",
      "https://app.test/orders/index.html?v=2",
    ]);
  });
});
