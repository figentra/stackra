/**
 * Stackra file contract:
 * Purpose: the web `Component<P>`, the base of a class component (`class ContactForm extends Component<Props>`): it
 *          types `this.props` and asks for `render()`. Gen's `classComponents()` compiles each subclass to a function
 *          component (fields to state, `use*` fields to hooks, `render()` to the body), and an app reaches this base
 *          through its generated `#stackra/ui` facade.
 * Boundary: a type-level base with no runtime member: it holds no state and calls nothing, because the compiled
 *           component is a function. It declares React's class surface as types only (`declare`, nothing
 *           emitted), so tsc takes a subclass as a JSX element and a `ComponentType`; a subclass's implicit `new ()`
 *           fits `new (props)`. `mount()` and `unmount()` are the subclass's own, read by the compiler.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 37 to 41: class components); ADR 0302 (decision 3).
 */
import type { Component as ReactComponent, ReactNode } from "react";

/**
 * The base of a web class component.
 *
 * @example
 * export class Greeting extends Component<GreetingProps> {
 *   render() {
 *     return <Text>{this.props.name}</Text>;
 *   }
 * }
 */
export abstract class Component<P extends object = object> {
  /** The props the host passed; a component never writes them. */
  declare readonly props: Readonly<P>;

  // React's class surface, declared only (nothing emitted), so tsc takes a subclass where React expects a component.

  /** React's state slot; a class component's fields are its state once compiled. */
  declare readonly state: ReactComponent<P>["state"];

  /** React's context slot; a component reads a context through a hook field. */
  declare readonly context: ReactComponent<P>["context"];

  /** React's setter; a component writes a field instead. */
  declare readonly setState: ReactComponent<P>["setState"];

  /** React's re-render; never needed, since a field write re-renders. */
  declare readonly forceUpdate: ReactComponent<P>["forceUpdate"];

  /** What the component draws. */
  abstract render(): ReactNode;
}
