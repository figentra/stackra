/**
 * Stackra file contract:
 * Purpose: unit tests of `emitClientTools`: the table file holds the app key, a stable hash and L0 client rows, is typed
 *          from `@stackra/ai/contracts` only when the app declares it, and is absent without tools.
 * Boundary: test only; runs on the web app IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0490 (decisions 1 and 3); STA-1631.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitClientTools } from "#core/functions/emit-client-tools.function";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

describe("emitClientTools", () => {
  it("writes the app's table with L0 client rows and a stable hash", () => {
    const { content, errors } = emitClientTools(WEB_APP_IR);
    expect(errors).toEqual([]);
    expect(content).toContain('app: "web",');
    expect(content).toContain(
      '"name":"navigate_order_detail","from":"client","risk":"L0","kind":"navigate"',
    );
    expect(content).not.toContain("@stackra/ai/contracts");
    expect(content).toMatch(/hash: "[0-9a-z]+",/);
    expect(emitClientTools(WEB_APP_IR).content).toBe(content);
  });

  it("types the table when the app declares @stackra/ai", () => {
    const typed = emitClientTools({
      ...WEB_APP_IR,
      packages: [...(WEB_APP_IR.packages ?? []), "@stackra/ai"],
    });
    expect(typed.content).toContain(
      'import type { ClientToolTable } from "@stackra/ai/contracts";',
    );
    expect(typed.content).toContain("export const clientTools: ClientToolTable = {");
  });

  it("writes nothing without tools", () => {
    expect(emitClientTools({ ...WEB_APP_IR, classes: [] }).content).toBeUndefined();
  });
});
