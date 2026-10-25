/**
 * Stackra file contract:
 * Purpose: proves the native `Component<P>` is an abstract base with no runtime member that types `this.props` as
 *          `Readonly<P>` and asks a subclass for `render()`, the shape the generated `#stackra/ui` facade extends.
 * Boundary: test only; the class is never rendered, because the Metro transformer compiles it to a function.
 * Runtime: node
 * Governing contract: ADR 0305 (rules 37 to 41); ADR 0022 (test placement).
 */
import type { ReactNode } from "react";

import { Component } from "#native/component/component";

/** A class component as an app writes one. */
class Greeting extends Component<{ readonly name: string }> {
  render(): ReactNode {
    return this.props.name;
  }
}

describe("Component (native)", () => {
  it("adds no runtime member", () => {
    expect(Object.getOwnPropertyNames(new Greeting())).toEqual([]);
  });

  it("types the props and asks for render", () => {
    expectTypeOf<Greeting["props"]>().toEqualTypeOf<Readonly<{ readonly name: string }>>();
    expectTypeOf<Component["render"]>().returns.toEqualTypeOf<ReactNode>();
  });
});
