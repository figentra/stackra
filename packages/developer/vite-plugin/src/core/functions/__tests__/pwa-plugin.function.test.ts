/**
 * Stackra file contract:
 * Purpose: unit tests of `pwaPlugin`: gen's worker source is built with `injectManifest`, no generated manifest and no
 *          injected registration, and the prerendered documents are precached only with
 *          `additionalManifestEntries: "prerender"`; a member without the optional peer `vite-plugin-pwa` gets one error
 *          that names what to add, and any other failure of the import is passed on unchanged.
 * Boundary: test only; `vite-plugin-pwa` is mocked and its options are inspected.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0255 (decisions 1 and 2).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { pwaPlugin } from "#core/functions/pwa-plugin.function";

const { VitePWA } = vi.hoisted(() => ({ VitePWA: vi.fn(() => ({ name: "vite-plugin-pwa" })) }));
vi.mock("vite-plugin-pwa", () => ({ VitePWA }));

/** A loader that fails with `error`, as an import of a package that is not there does. */
const failingWith = (error: Error) => () => Promise.reject(error);

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

  describe("without the optional peer vite-plugin-pwa", () => {
    it("says what to add when the package is not installed", async () => {
      const cause = Object.assign(
        new Error("Cannot find package 'vite-plugin-pwa' imported from /member/vite.config.ts"),
        { code: "ERR_MODULE_NOT_FOUND" },
      );
      const rejection = expect(pwaPlugin(PWA, [], failingWith(cause))).rejects;
      await rejection.toThrow(/optional peer of @stackra\/vite-plugin/);
      await rejection.toThrow(/pnpm add -D vite-plugin-pwa/);
      await rejection.toMatchObject({ cause });
    });

    it("passes on a missing package deeper in its tree, which is the package's own fault", async () => {
      const cause = Object.assign(
        new Error("Cannot find package 'workbox-build' imported from x"),
        {
          code: "ERR_MODULE_NOT_FOUND",
        },
      );
      await expect(pwaPlugin(PWA, [], failingWith(cause))).rejects.toBe(cause);
    });
  });
});
