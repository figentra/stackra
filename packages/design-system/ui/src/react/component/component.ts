/**
 * Stackra file contract:
 * Purpose: the web `Component<P>`, the base of a class component (`class ContactForm extends Component<Props>`): it
 *          types `this.props` and asks for `render()`. Gen's `classComponents()` compiles each subclass to a function
 *          component (fields to state, `use*` fields to hooks, `render()` to the body), and an app reaches this base
 *          through its generated `#stackra/ui` facade.
 * Boundary: a type-level base with no runtime member: it holds no state and calls nothing, because the compiled
 *           component is a function. `mount()` and `unmount()` are the subclass's own, read by the compiler.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 37 to 41: class components); ADR 0302 (decision 3).
 */
import type { ReactNode } from "react";

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

  /** What the component draws. */
  abstract render(): ReactNode;
}
