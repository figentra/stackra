/**
 * Stackra file contract:
 * Purpose: unit tests of `emitRuntimeEntries`: a service gets `server`, a worker `worker`, an app one entry per runtime
 *          of its targets (iOS and Android share `native`), each calling `createApp` with the root module and the
 *          wiring; a package gets none.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decisions 7 to 9).
 */
import { describe, expect, it } from "@stackra/testing";

import { emitRuntimeEntries } from "#core/functions/emit-runtime-entries.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";

describe("emitRuntimeEntries", () => {
  it("writes the server entry of a service", () => {
    const [server, ...rest] = emitRuntimeEntries(COMMERCE_IR);
    expect(rest).toEqual([]);
    expect(server?.path).toBe(".stackra/entry/server.ts");
    expect(server?.content).toContain('import { createApp } from "@stackra/app/server";');
    expect(server?.content).toContain('import { CommerceModule } from "#stackra/module";');
    expect(server?.content).toContain('import { wiring } from "#stackra/wiring";');
    expect(server?.content).toContain(
      "export const app = await createApp(CommerceModule, { wiring });",
    );
  });

  it("writes one entry per runtime of an app's targets", () => {
    const app = {
      ...COMMERCE_IR,
      layout: "app" as const,
      kind: "app" as const,
      targets: ["web", "ios", "android", "desktop", "pwa"],
    };
    expect(emitRuntimeEntries(app).map((file) => file.path)).toEqual([
      ".stackra/entry/browser.ts",
      ".stackra/entry/native.ts",
      ".stackra/entry/electron.ts",
    ]);
  });

  it("writes the worker entry of a worker and none for a package", () => {
    expect(
      emitRuntimeEntries({ ...COMMERCE_IR, layout: "worker" }).map((file) => file.path),
    ).toEqual([".stackra/entry/worker.ts"]);
    expect(emitRuntimeEntries(LOYALTY_KIT_IR)).toEqual([]);
  });
});
