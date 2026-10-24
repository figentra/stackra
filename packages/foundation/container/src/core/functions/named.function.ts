/**
 * Stackra file contract:
 * Purpose: `named`, the token of one named instance of a port, which gen prints in the wiring where a constructor
 *          parameter is typed `Named<Port, "x">`, and a test passes to `get` or `override`.
 * Boundary: interns its tokens: the same port and name always give the same frozen object, so a token is a map key.
 *           Never a string token: the port class stays the key, the name only picks an instance of it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 17); ADR 0263 (decision 4 as amended by 0294).
 */
import type { Port } from "@stackra/contracts";

import type { AnyClass } from "#core/types/any-class.type";
import type { NamedToken } from "#core/types/named-token.type";

/** Port to its interned tokens by name. */
const TOKENS = new WeakMap<object, Map<string, NamedToken>>();

/**
 * The token of the instance of `port` named `name`.
 *
 * @throws TypeError when `name` is empty.
 * @example
 * deps: [named(LoyaltyLedger, "primary"), LoyaltyLedger]
 */
export function named<P extends Port, N extends string>(
  port: AnyClass<P>,
  name: N,
): NamedToken<P, N> {
  if (name === "") throw new TypeError(`A named instance of ${port.name} needs a name`);
  const byName = TOKENS.get(port) ?? new Map<string, NamedToken>();
  TOKENS.set(port, byName);
  const token = byName.get(name) ?? Object.freeze({ port, name });
  byName.set(name, token);
  return token as NamedToken<P, N>;
}
