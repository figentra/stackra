/**
 * Stackra file contract:
 * Purpose: unit tests of `AppNativeDepsCommand` on the console: a missing native library exits 1 with its row and the
 *          findings are the `--json` data; none exits 0.
 * Boundary: test only; the finder is replaced, so no manifest is read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0506; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { appNativeDependencyFindings } from "#node/app-native-deps/functions/app-native-dependency-findings.function";
import { AppNativeDepsCommand } from "#node/commands/app-native-deps.command";

vi.mock("#node/app-native-deps/functions/app-native-dependency-findings.function", () => ({
  appNativeDependencyFindings: vi.fn(),
}));

const finding = { dir: "apps/mobile", text: "missing expo-sqlite (needed by @stackra/storage)" };

describe("AppNativeDepsCommand", () => {
  it("exits 1 on a finding, the findings as --json data, and 0 on none", async () => {
    vi.mocked(appNativeDependencyFindings).mockReturnValue([finding]);
    const failed = await runCommandForTest([AppNativeDepsCommand], ["app-native-deps", "--json"]);
    expect(failed.exitCode).toBe(1);
    expect(failed.json).toEqual({ ok: false, data: [finding] });
    vi.mocked(appNativeDependencyFindings).mockReturnValue([]);
    const clean = await runCommandForTest([AppNativeDepsCommand], ["app-native-deps"]);
    expect(clean.exitCode).toBe(0);
  });
});
