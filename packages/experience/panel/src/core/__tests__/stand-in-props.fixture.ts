/**
 * Stackra file contract:
 * Purpose: `StandInProps`, the props type of the DOM stand-ins the panel's page tests put in place of the web and
 *          native kits, declared once so the `any` it needs is one disable for the package.
 * Boundary: test only; imported as a type by the `__tests__` files of `src/react` and `src/native`.
 * Runtime: isomorphic
 * Governing contract: ADR 0022 (test placement); rule-gap N-5 (the any ratchet, stackra-229).
 */

/** A stand-in's props, read loosely: each stand-in reads only the few props its test draws. */
// oxlint-disable-next-line typescript/no-explicit-any -- reason: the DOM stand-ins read the kit's props loosely
export type StandInProps = Record<string, any>;
