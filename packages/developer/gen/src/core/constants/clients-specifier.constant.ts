/**
 * Stackra file contract:
 * Purpose: `CLIENTS_SPECIFIER`, the import prefix of a generated service client (`#stackra/clients/<service>`), which
 *          the member's `#stackra/*` import map resolves to `.stackra/gen/clients/<service>.ts`.
 * Boundary: one spelling, read by the source reader (a constructor parameter typed with a client is a class token
 *           before the client file exists), the clients emitter and the wiring.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3); ADR 0261 (generated `#stackra` modules); ADR 0263 (classes are tokens).
 */

/** The specifier prefix of a generated service client. */
export const CLIENTS_SPECIFIER = "#stackra/clients/";
