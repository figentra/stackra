/**
 * Stackra file contract:
 * Purpose: `Port`, the kind base of every port: an abstract contract class a package defines and someone else
 *          implements with a driver, so the package never imports its implementer.
 * Boundary: holds no state and assigns nothing in a constructor (0294 decision 25). The class itself is the DI token;
 *           gen derives the port key `<member>.<ClassName>` and prints the wiring, so nothing here reads metadata.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16, 17 and 25), ADR 0127 2026-10-24 note (Port lives in contracts), ADR 0263
 *                     (ports resolve by type).
 */

/**
 * The base of a port. A port is `abstract class X extends Port` with abstract members only, in a package's
 * `contracts/ports/`; a driver implements it with `extends Driver(X)` from `@stackra/container`.
 *
 * @example
 * export abstract class LoyaltyMembers extends Port {
 *   abstract isMember(principalId: MemberId): Promise<boolean>;
 * }
 */
export abstract class Port {
  /**
   * Type-only kind brand, so a class of another kind cannot stand in for a port. A driver of a port keeps this brand:
   * it is that port to every consumer.
   */
  declare readonly "~kind": "port";
}
