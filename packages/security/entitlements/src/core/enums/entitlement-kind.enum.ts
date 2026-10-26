/**
 * Stackra file contract:
 * Purpose: `EntitlementKind`, what kind of plan right an entitlement is: a feature the plan includes, a limit on how
 *          many of a model the plan allows, a module the plan installs, or a plain number the plan sets that counts no
 *          model (the audit visible window in days).
 * Boundary: an `Enum.of` value plus the type of the same name. The first three kinds are ADR 0215 decision 1; `value`
 *           is ADR 0408 (STA-824); a new kind is an ADR change.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decision 1: feature, limit and module entitlements); ADR 0231 (snake_case codes); ADR
 *                     0408 (the numeric value kind).
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
  /** A plain number the plan sets, counting no model (a retention window in days); granted as a number. */
  Value: "value",
});

/** One of the codes above. */
export type EntitlementKind = Enum.Value<typeof EntitlementKind>;
