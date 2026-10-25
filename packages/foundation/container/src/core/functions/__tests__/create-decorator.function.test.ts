/**
 * Stackra file contract:
 * Purpose: unit tests of `createDecorator`: a class, field or method decorator records its value under itself and
 *          installs no accessor, reads back through the ancestry (`on`, `members`), refuses a target it was not made
 *          for and a class outside its kinds, and refuses an empty kind list.
 * Boundary: test only; legacy decorators under the decorators preset, `useDefineForClassFields` on.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { Service } from "#core/bases/service.base";
import { createDecorator } from "#core/functions/create-decorator.function";

const Audited = createDecorator<{ readonly level: number }>({
  kind: "audited",
  target: "class",
  kinds: ["service"],
});

const Max = createDecorator<number>({ kind: "max", target: "field", kinds: ["service"] });

const Step = createDecorator<string>({ kind: "step", target: "method", kinds: ["service"] });

@Audited({ level: 1 })
class Reads extends Service {
  @Max(10)
  count = 3;

  @Step("load")
  load(): number {
    return this.count;
  }
}

class VipReads extends Reads {
  @Max(20)
  override count = 4;
}

@Audited({ level: 2 })
class SecretReads extends Reads {}

describe("createDecorator", () => {
  it("exposes its definition", () => {
    expect([Audited.kind, Audited.target, Audited.kinds]).toEqual([
      "audited",
      "class",
      ["service"],
    ]);
    expect(Object.isFrozen(Audited.kinds)).toBe(true);
  });

  it("records a class decorator's value, read through the ancestry", () => {
    expect(Audited.on(Reads)).toEqual({ level: 1 });
    expect(Audited.on(VipReads)).toEqual({ level: 1 });
    expect(Audited.on(SecretReads)).toEqual({ level: 2 });
    expect(Audited.on(Service)).toBeUndefined();
  });

  it("records field and method values by member, a subclass winning", () => {
    expect(Max.members(Reads)).toEqual(new Map([["count", 10]]));
    expect(Max.members(VipReads)).toEqual(new Map([["count", 20]]));
    expect(Step.members(VipReads)).toEqual(new Map([["load", "load"]]));
    expect(Max.on(Reads)).toBeUndefined();
    expect(Audited.members(Reads).size).toBe(0);
  });

  it("records only: no accessor is installed and initializers stay the values", () => {
    expect(Object.getOwnPropertyDescriptor(Reads.prototype, "count")).toBeUndefined();
    expect(new Reads().count).toBe(3);
    expect(new VipReads().count).toBe(4);
    expect(new Reads().load()).toBe(3);
  });

  it("refuses a target it was not made for", () => {
    expect(() => {
      class Misplaced extends Service {
        @Audited({ level: 1 })
        field = 1;
      }
      return Misplaced;
    }).toThrow(/@audited decorates a class, not a field/);
  });

  it("refuses a class outside its kinds", () => {
    expect(() => {
      @Audited({ level: 1 })
      class Plain {}
      return Plain;
    }).toThrow(/@audited may mark service; Plain is of no kind/);
  });

  it("refuses a definition with no kinds", () => {
    expect(() => createDecorator({ kind: "nothing", target: "class", kinds: [] })).toThrow(
      TypeError,
    );
  });
});
