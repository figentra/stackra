/**
 * Stackra file contract:
 * Purpose: unit tests of `sentryPlugin`: the hidden maps go to the runway's project, are deleted after the upload,
 *          the Sentry plugin's telemetry is off, and no token or organisation is passed.
 * Boundary: test only; `@sentry/vite-plugin` is mocked and its options are inspected.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0184; ADR 0173.
 */
import { describe, expect, it, vi } from "@stackra/testing";

import { sentryPlugin } from "#core/functions/sentry-plugin.function";

const { sentryVitePlugin } = vi.hoisted(() => ({
  sentryVitePlugin: vi.fn(() => ({ name: "sentry" })),
}));
vi.mock("@sentry/vite-plugin", () => ({ sentryVitePlugin }));

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
});
