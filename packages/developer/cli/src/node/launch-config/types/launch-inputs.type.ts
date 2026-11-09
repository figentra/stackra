/**
 * Stackra file contract:
 * Purpose: `LaunchInputs`, what the launch file is rendered from: the root runway's web surfaces in declaration order,
 *          the members with a dev port, and where the `stackra` CLI comes from.
 * Boundary: type only; `readLaunchInputs` builds it from a repository, tests build it by hand.
 * Runtime: node
 * Governing contract: ADR 0441 (decision 3: surfaces in the root runway); ADR 0296; STA-2081.
 */
import type { LaunchMember } from "#node/launch-config/types/launch-member.type";

/** The facts the launch file is rendered from. */
export type LaunchInputs = {
  /** The root runway's surface keys in declaration order, `ops` left out (the OS ships the ops console). */
  readonly surfaces: readonly string[];

  /** Every app and Worker member whose runway declares a dev port, by folder. */
  readonly members: readonly LaunchMember[];

  /** `local`: this repository builds the CLI (core); `installed`: the product runs its installed `stackra`. */
  readonly cli: "local" | "installed";
};
