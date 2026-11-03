/**
 * Stackra file contract:
 * Purpose: unit tests of `emitUiFacade`: a web app, a package and a web plus iOS app get `@stackra/ui/react`, an iOS
 *          and Android app gets `@stackra/ui/native`, a member without `@stackra/ui` or without a package list gets
 *          nothing, and the file is the generated header and one export line.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rule 37); STA-2069.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitUiFacade } from "#core/functions/emit-ui-facade.function";
import { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";
import type { MemberIR } from "#core/types/member-ir.type";

/** `ir` declaring `@stackra/ui` beside its other packages. */
function withUi(ir: MemberIR): MemberIR {
  return { ...ir, packages: [...(ir.packages ?? []), "@stackra/ui"] };
}

describe("emitUiFacade", () => {
  // @covers sta-2069:FR-001
  it("re-exports the react Component for a web app, a package and a web plus iOS app", () => {
    for (const ir of [
      withUi({ ...WEB_APP_IR, targets: ["web"] }),
      withUi(LOYALTY_KIT_IR),
      withUi({ ...WEB_APP_IR, targets: ["web", "ios"] }),
    ])
      expect(emitUiFacade(ir)).toContain('export { Component } from "@stackra/ui/react";');
  });

  // @covers sta-2069:FR-002
  it("re-exports the native Component for an app that targets only iOS and Android", () => {
    expect(emitUiFacade(withUi({ ...WEB_APP_IR, targets: ["ios", "android"] }))).toContain(
      'export { Component } from "@stackra/ui/native";',
    );
  });

  // @covers sta-2069:FR-003
  it("writes nothing for a member that does not declare @stackra/ui, or has no package list", () => {
    expect(emitUiFacade(WEB_APP_IR)).toBeUndefined();
    const { packages: _packages, ...bare } = WEB_APP_IR;
    expect(emitUiFacade(bare)).toBeUndefined();
  });

  // @covers sta-2069:FR-004
  it("is the generated header and one export line", () => {
    const content = emitUiFacade(withUi(WEB_APP_IR)) ?? "";
    expect(content).toContain(GENERATED_NOTICE);
    const body = content.slice(content.indexOf("*/") + 2).trim();
    expect(body).toBe('export { Component } from "@stackra/ui/react";');
    expect(content.endsWith("\n")).toBe(true);
  });
});
