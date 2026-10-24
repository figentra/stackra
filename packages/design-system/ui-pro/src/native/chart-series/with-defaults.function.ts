/**
 * Stackra file contract:
 * Purpose: a copy of a HeroUI Pro part that renders it with some props defaulted, so a wrapper can change a default
 *          (a native chart series animating, ADR 0329) without re-declaring the part's props.
 * Boundary: pure; the part itself is not changed, and a prop the caller passes, `undefined` included, wins over the
 *           default. The copy keeps the part's `displayName`.
 * Runtime: react-native
 * Governing contract: ADR 0329 (motion layer); ADR 0310 (decision 3: unknown props pass through, typed).
 */
import { createElement, type ComponentType } from "react";

/** A component as HeroUI Pro declares one: a function or a class, with statics such as `displayName`. */
type Part = ((props: never) => unknown) | (abstract new (props: never) => unknown);

/** The props a part takes. */
type PropsOf<TPart> = TPart extends (props: infer P) => unknown
  ? P
  : TPart extends abstract new (props: infer P) => unknown
    ? P
    : never;

/**
 * `part` with `defaults` spread under its props.
 * @param part - the HeroUI Pro part to render
 * @param defaults - the props it gets when its caller leaves them out
 * @returns a component typed as `part`, rendering it with the defaults
 */
export function withDefaults<TPart extends Part>(
  part: TPart,
  defaults: Partial<PropsOf<TPart>>,
): TPart {
  const component = part as unknown as ComponentType<object> & { displayName?: string };
  const WithDefaults = (props: object) => createElement(component, { ...defaults, ...props });
  WithDefaults.displayName = component.displayName;
  // A cast: the copy takes and renders exactly `part`'s props, which TypeScript cannot carry through a generic part.
  return WithDefaults as unknown as TPart;
}
