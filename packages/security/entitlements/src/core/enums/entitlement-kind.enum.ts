/**
 * Stackra file contract:
 * Purpose: `EntitlementKind`, what kind of plan right an entitlement is: a feature the plan includes, a limit on how
 *          many of a model the plan allows, or a module the plan installs.
 * Boundary: an `Enum.of` value plus the type of the same name. The three kinds are ADR 0215 decision 1; a new kind is
 *           an ADR change.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decision 1: feature, limit and module entitlements); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The kinds of an entitlement. */
export const EntitlementKind = Enum.of({
  /** A feature the plan includes or not; granted as a boolean. */
  Feature: "feature",
  /** How many of a counted model the plan allows; granted as a number. */
  Limit: "limit",
  /** A module the plan installs or not; granted as a boolean. */
  Module: "module",
});

/** One of the codes above. */
export type EntitlementKind = Enum.Value<typeof EntitlementKind>;
