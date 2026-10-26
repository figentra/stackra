/**
 * Stackra file contract:
 * Purpose: unit tests of `emitRuntimeEntries`: a service gets `server`, which loads its registrations when they are
 *          written and hands `createApp` its boot when gen writes one; an app gets `browser` (web, PWA, desktop renderer) and `native` (iOS, Android), each in the form
 *          its `createApp` takes and loading the route table and blocks this run writes; a package and a worker get
 *          none.
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
    const [server, ...rest] = emitRuntimeEntries(COMMERCE_IR, [".stackra/gen/registrations.ts"]);
    expect(rest).toEqual([]);
    expect(server?.path).toBe(".stackra/entry/server.ts");
    expect(server?.content).toContain('import "#stackra/registrations";');
    expect(server?.content).toContain('import { createApp } from "@stackra/app/server";');
    expect(server?.content).toContain('import { CommerceModule } from "#stackra/module";');
    expect(server?.content).toContain('import { wiring } from "#stackra/wiring";');
    expect(server?.content).toContain(
      "export const app = await createApp(CommerceModule, { wiring });",
    );
  });

  it("loads only the generated files this run writes", () => {
    const content = emitRuntimeEntries(COMMERCE_IR)[0]?.content;
    expect(content).not.toContain("#stackra/registrations");
    expect(content).not.toContain("#stackra/boot");
  });

  it("hands createApp the boot when gen writes one", () => {
    const content = emitRuntimeEntries(COMMERCE_IR, [".stackra/gen/boot.ts"])[0]?.content;
    expect(content).toContain('import { boot } from "#stackra/boot";');
    expect(content).toContain(
      "export const app = await createApp(CommerceModule, { wiring, boot });",
    );
  });

  it("writes one entry per client runtime of an app's targets", () => {
    const app = {
      ...COMMERCE_IR,
      layout: "app" as const,
      kind: "app" as const,
      targets: ["web", "ios", "android", "desktop", "pwa"],
    };
    const [browser, native, ...rest] = emitRuntimeEntries(app, [
      ".stackra/gen/routes/browser.ts",
      ".stackra/gen/blocks/native.ts",
    ]);
    expect(rest).toEqual([]);
    expect(browser?.path).toBe(".stackra/entry/browser.ts");
    expect(browser?.content).toContain('import "#stackra/routes/browser";');
    expect(browser?.content).not.toContain("#stackra/blocks/browser");
    expect(browser?.content).not.toContain("CommerceModule");
    expect(browser?.content).toContain("export const app = await createApp(wiring);");
    expect(native?.path).toBe(".stackra/entry/native.ts");
    expect(native?.content).toContain('import "#stackra/blocks/native";');
    expect(native?.content).toContain("export const app = createApp(CommerceModule, { wiring });");
  });

  it("writes none for a package or a worker", () => {
    expect(emitRuntimeEntries(LOYALTY_KIT_IR)).toEqual([]);
    expect(emitRuntimeEntries({ ...COMMERCE_IR, layout: "worker" })).toEqual([]);
  });
});
