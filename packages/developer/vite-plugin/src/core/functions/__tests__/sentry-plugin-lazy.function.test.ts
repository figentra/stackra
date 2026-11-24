/**
 * Stackra file contract:
 * Purpose: unit test that `@sentry/vite-plugin`, an optional peer, is not loaded by importing `sentryPlugin` (so a member with Sentry off,
 *          and without the package, never touches it) and is loaded only when the plugin is asked for.
 * Boundary: test only; `@sentry/vite-plugin` is mocked and the mock's factory records when the module is first loaded. This sits
 *           in its own file because the factory runs once per file, on the first load.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0184; STA-2782.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { sentryPlugin } from "#core/functions/sentry-plugin.function";

const { loaded } = vi.hoisted(() => ({ loaded: vi.fn() }));
vi.mock("@sentry/vite-plugin", () => {
  loaded();
  return { sentryVitePlugin: () => ({ name: "sentry" }) };
});

describe("sentryPlugin laziness", () => {
  it("does not load @sentry/vite-plugin when the module is imported, only when the plugin is asked for", async () => {
    expect(loaded).not.toHaveBeenCalled();
    await sentryPlugin({ upload: "sentry", project: "acme-console" });
    expect(loaded).toHaveBeenCalledTimes(1);
  });
});
