/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `Bridge` kind base: a called form records kind `bridge` with its options, a
 *          subclass keeps constructor injection through `super()`, and each call returns its own class.
 * Boundary: test only; reads the kind registry through `kindOf`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decisions 16 and 25); ADR 0251 (as amended by 0294).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Capability } from "#core/enums/capability.enum";
import { Bridge } from "#desktop/bases/bridge.base";

/** A bridge with one dependency. */
class EchoBridge extends Bridge({ key: "echo.say", capability: Capability.Window }) {
  readonly prefix: string;

  constructor(prefix: string) {
    super();
    this.prefix = prefix;
  }

  async handle(input: { readonly text: string }): Promise<string> {
    return `${this.prefix}${input.text}`;
  }
}

describe("Bridge", () => {
  it("records the kind and options of a bridge class", () => {
    expect(kindOf(EchoBridge)).toEqual({
      kind: "bridge",
      options: { key: "echo.say", capability: "window" },
    });
  });

  it("keeps constructor injection and the handle method", async () => {
    const bridge = new EchoBridge("> ");
    expect(await bridge.handle({ text: "hi" })).toBe("> hi");
    expectTypeOf(bridge).toExtend<Bridge>();
  });

  it("returns a fresh class per call", () => {
    expect(Bridge({ key: "a.b" })).not.toBe(Bridge({ key: "a.b" }));
  });
});
