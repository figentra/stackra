/**
 * Stackra file contract:
 * Purpose: `SlotComponent<P>`, the component a slot fill draws: a function of the slot's props.
 * Boundary: a type only; renderer-neutral, so a React (web or native) function component of `P` fits without this
 *           package depending on React.
 * Runtime: isomorphic
 * Governing contract: ADR 0438 (a fill is a component of the slot's props type); app-shells-edge-and-extension.md 7.2.
 */

/** A component that takes the props `P` of the slot it fills. */
export type SlotComponent<P extends object> = (props: P) => unknown;
