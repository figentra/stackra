/**
 * Stackra file contract:
 * Purpose: proves the web `Component<P>` is an abstract base with no runtime member that types `this.props` as
 *          `Readonly<P>` and asks a subclass for `render()`, and that tsc takes a subclass as a JSX element and a
 *          `ComponentType` with its props checked, the shape the generated `#stackra/ui` facade extends.
 * Boundary: test only; the class is never rendered, because gen compiles a class component to a function.
 * Runtime: node
 * Governing contract: ADR 0305 (rules 37 to 41); ADR 0022 (test placement).
 */
import type { ComponentType, ReactNode } from "react";

import { Component } from "#react/component/component";

/** A class component as an app writes one. */
class Greeting extends Component<{ readonly name: string }> {
  render(): ReactNode {
    return this.props.name;
  }
}

describe("Component (web)", () => {
  it("adds no runtime member", () => {
    expect(Object.getOwnPropertyNames(new Greeting())).toEqual([]);
  });

  it("types the props and asks for render", () => {
    expectTypeOf<Greeting["props"]>().toEqualTypeOf<Readonly<{ readonly name: string }>>();
    expectTypeOf<Component["render"]>().returns.toEqualTypeOf<ReactNode>();
  });

  /** tsc checks a subclass against React's class surface: JSX, `ComponentType`, and its props. */
  it("is a JSX element and a ComponentType, with its props checked", () => {
    const element = <Greeting name="Amal" />;
    const type: ComponentType<{ readonly name: string }> = Greeting;
    expect(element.type).toBe(Greeting);
    expect(type).toBe(Greeting);
    // @ts-expect-error a missing prop is a type error, as for a function component
    const missing = <Greeting />;
    expect(missing.type).toBe(Greeting);
  });
});
