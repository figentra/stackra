/**
 * Stackra file contract:
 * Purpose: `CONSUMER_GATE_SCAFFOLD`, how the gate makes a `scaffold` consumer: the built CLI it runs from the core
 *          tree, the app name and scope `stackra create` gets, the default starter profile, and the area and summary
 *          of the service `stackra new service` adds.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); ADR 0515 (decision 3); STA-1813 (FR-013); STA-2705.
 */

/** The scaffold consumer's fixed inputs. */
export const CONSUMER_GATE_SCAFFOLD = {
  /** The built `stackra` binary, relative to the core tree: the CLI of the train under test, never a published one. */
  cli: "packages/developer/cli/dist/stackra.mjs",
  /** The app's package name. */
  name: "consumer-gate",
  /** The app's npm scope. */
  scope: "@consumer-gate",
  /** The starter profile when the matrix names none. */
  profile: "minimal",
  /** The API area of the added service. */
  area: "app",
  /** The `stackra.summary` of the added service. */
  summary: "The consumer gate's example service: the fixture's action, model and migration.",
} as const;
