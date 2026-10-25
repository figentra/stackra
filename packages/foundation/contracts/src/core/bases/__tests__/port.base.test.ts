/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Port`: a port is an abstract class whose implementations are instances of it and
 *          of `Port`, the class works as a token, and the `~kind` brand is type-only and keeps other shapes out.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 16,
 *                     17 and 25).
 */
import { describe, expect, it } from "@stackra/testing";

import { Port } from "#core/bases/port.base";

abstract class Greeter extends Port {
  abstract greet(name: string): string;
}

class EnglishGreeter extends Greeter {
  override greet(name: string): string {
    return `Hello, ${name}`;
  }
}

describe("Port", () => {
  it("is the base of an abstract contract whose implementation is an instance of both", () => {
    const greeter = new EnglishGreeter();
    expect(greeter).toBeInstanceOf(Greeter);
    expect(greeter).toBeInstanceOf(Port);
    expect(greeter.greet("Sara")).toBe("Hello, Sara");
  });

  it("works as a token: the abstract class itself is the key a binding is found by", () => {
    const bindings = new Map<abstract new (...args: never[]) => Port, Port>([
      [Greeter, new EnglishGreeter()],
    ]);
    expect(bindings.get(Greeter)).toBeInstanceOf(EnglishGreeter);
  });

  it("carries the kind brand in the type only", () => {
    const kind: Greeter["~kind"] = "port";
    expect(kind).toBe("port");
    expect("~kind" in new EnglishGreeter()).toBe(false);
    expect(Object.keys(new EnglishGreeter())).toEqual([]);
  });

  it("keeps a shape that is not a port out", () => {
    // @ts-expect-error -- a plain object has no port brand
    const notAPort: Port = {};
    expect(notAPort).toEqual({});
  });
});
