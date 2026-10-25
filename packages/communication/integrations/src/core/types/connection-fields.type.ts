/**
 * Stackra file contract:
 * Purpose: `ConnectionFields<C>`, the fields a connection class declares (plain and `@Secret`), without the members
 *          every connection shares and without methods: what `connect` and `makeConnection` take.
 * Boundary: a type only. Iterating `keyof C` keeps each field's optional and readonly modifiers.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 2: a connection's tenant or user values are plain and `@Secret` fields).
 */
import type { Connection } from "#core/bases/connection.base";

/**
 * The declared fields of connection `C`.
 *
 * @example
 * type F = ConnectionFields<ResendConnection>; // { apiKey: string; fromAddress: Email; webhookSecret: string }
 */
export type ConnectionFields<C extends Connection> = {
  [
    K in keyof C as K extends keyof Connection
      ? never
      : C[K] extends (...args: never[]) => unknown
        ? never
        : K
  ]: C[K];
};
