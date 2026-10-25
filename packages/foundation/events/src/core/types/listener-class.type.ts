/**
 * Stackra file contract:
 * Purpose: `ListenerClass`, a listener class: what both forms of `Listener` are, and what `registerListeners` and
 *          `app.listeners` take.
 * Boundary: a type only. The instance type keeps `handle` abstract, so a subclass that does not implement it fails to
 *           compile.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0305 (rule 2).
 */
import type { ListenerBase } from "#core/bases/listener.base";

/** A class of listeners; its constructor takes the dependencies gen wires (ADR 0294 decision 25). */
export type ListenerClass = abstract new (...args: never[]) => ListenerBase;
