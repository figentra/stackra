/**
 * Stackra file contract:
 * Purpose: `BROKER_MESSAGE_IMPORT`, the line a generated `.stackra/encore/<member>/*.ts` file imports `BrokerMessage`
 *          with: from `broker-message.ts` beside it, never from a package, since Encore cannot resolve a type through
 *          a package's dist (its declarations sit in hashed `.d.mts` chunks).
 * Boundary: a constant string; `emitEncoreBrokerMessage` writes the file it names whenever a generated file holds it.
 * Runtime: isomorphic
 * Governing contract: ADR 0091 and 0124 (the generated Encore app); ADR 0148 (decision 3: Encore Pub/Sub).
 */

/** The import line of the local `BrokerMessage` in a generated Encore file. */
export const BROKER_MESSAGE_IMPORT = 'import type { BrokerMessage } from "./broker-message";';
