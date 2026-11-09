/**
 * Stackra file contract:
 * Purpose: `COMPONENT_MODULE`, the module a class component imports its `Component<P>` base from (`#stackra/ui`, the
 *          facade `emitUiFacade` writes to `.stackra/gen/ui.ts` for a member that declares `@stackra/ui`), which is how
 *          the compiler tells a component class from any other class.
 * Boundary: a constant string. React's own `Component` is never compiled.
 * Runtime: node
 * Governing contract: ADR 0305 (rule 37: `Component` comes from `#stackra/ui`); STA-2069 (the facade).
 */

/** The facade module of `Component<P>`. */
export const COMPONENT_MODULE = "#stackra/ui";
