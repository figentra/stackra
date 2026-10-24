/**
 * Stackra file contract:
 * Purpose: unit tests of `pwaPlugin`: gen's worker source is built with `injectManifest`, no generated manifest and no
 *          injected registration, and the prerendered documents are precached only with
 *          `additionalManifestEntries: "prerender"`.
 * Boundary: test only; `vite-plugin-pwa` is mocked and its options are inspected.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0255 (decisions 1 and 2).
 */
import { describe, expect, it, vi } from "@stackra/testing";

import { pwaPlugin } from "#core/functions/pwa-plugin.function";

const { VitePWA } = vi.hoisted(() => ({ VitePWA: vi.fn(() => ({ name: "vite-plugin-pwa" })) }));
vi.mock("vite-plugin-pwa", () => ({ VitePWA }));

const PWA = { strategies: "injectManifest", srcDir: ".stackra", filename: "sw.ts" } as const;

describe("pwaPlugin", () => {
  it("builds gen's worker with the precache manifest injected", async () => {
    expect(await pwaPlugin(PWA, [])).toEqual({ name: "vite-plugin-pwa" });
    expect(VitePWA).toHaveBeenLastCalledWith(
      expect.objectContaining({
        strategies: "injectManifest",
        srcDir: ".stackra",
        filename: "sw.ts",
        manifest: false,
        injectRegister: false,
      }),
    );
  });

  it("precaches the prerendered documents only when asked", async () => {
    await pwaPlugin({ ...PWA, additionalManifestEntries: "prerender" }, ["/offline"]);
    expect(VitePWA).toHaveBeenLastCalledWith(
      expect.objectContaining({ injectManifest: expect.objectContaining({ globIgnores: [] }) }),
    );

    await pwaPlugin(PWA, ["/offline", "/ar-sa/offline"]);
    expect(VitePWA).toHaveBeenLastCalledWith(
      expect.objectContaining({
        injectManifest: expect.objectContaining({
          globIgnores: ["offline/index.html", "ar-sa/offline/index.html"],
        }),
      }),
    );
  });
});
