/**
 * Stackra file contract:
 * Purpose: unit tests of `sentryPlugin`: the hidden maps go to the runway's project, are deleted after the upload,
 *          the Sentry plugin's telemetry is off, and no token or organisation is passed; `@sentry/vite-plugin` is an optional peer, so
 *          a member without it gets one error that names what to add, and any
 *          other failure of the import is passed on unchanged.
 * Boundary: test only; `@sentry/vite-plugin` is mocked and its options are inspected.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0184; ADR 0173.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { sentryPlugin } from "#core/functions/sentry-plugin.function";

const { sentryVitePlugin } = vi.hoisted(() => ({
  sentryVitePlugin: vi.fn(() => ({ name: "sentry" })),
}));
vi.mock("@sentry/vite-plugin", () => ({ sentryVitePlugin }));

const SOURCEMAPS = { upload: "sentry", project: "acme-console" } as const;

/** A loader that fails with `error`, as an import of a package that is not there does. */
const failingWith = (error: Error) => () => Promise.reject(error);

describe("sentryPlugin", () => {
  it("uploads to the project and deletes the maps, with no secret in its options", async () => {
    expect(await sentryPlugin({ upload: "sentry", project: "acme-console" })).toEqual({
      name: "sentry",
    });
    expect(sentryVitePlugin).toHaveBeenCalledWith({
      project: "acme-console",
      telemetry: false,
      sourcemaps: { filesToDeleteAfterUpload: ["**/*.map"] },
    });
  });

  describe("without the optional peer @sentry/vite-plugin", () => {
    it("says what to add when the package is not installed", async () => {
      const cause = Object.assign(
        new Error("Cannot find package '@sentry/vite-plugin' imported from /member/vite.config.ts"),
        { code: "ERR_MODULE_NOT_FOUND" },
      );
      const rejection = expect(sentryPlugin(SOURCEMAPS, failingWith(cause))).rejects;
      await rejection.toThrow(/optional peer of @stackra\/vite-plugin/);
      await rejection.toThrow(/pnpm add -D @sentry\/vite-plugin/);
      await rejection.toThrow(/`sourcemaps` option off/);
      await rejection.toMatchObject({ cause });
    });

    it("passes on a missing package deeper in its tree, which is the package's own fault", async () => {
      const cause = Object.assign(new Error("Cannot find package '@sentry/cli' imported from x"), {
        code: "ERR_MODULE_NOT_FOUND",
      });
      await expect(sentryPlugin(SOURCEMAPS, failingWith(cause))).rejects.toBe(cause);
    });

    it("passes on any other failure of the import", async () => {
      const cause = new Error("Unexpected token");
      await expect(sentryPlugin(SOURCEMAPS, failingWith(cause))).rejects.toBe(cause);
    });
  });
});
