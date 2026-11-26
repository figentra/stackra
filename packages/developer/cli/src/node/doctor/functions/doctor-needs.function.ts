/**
 * Stackra file contract:
 * Purpose: `doctorNeeds(workspace)`, what a workspace needs from the machine: `services` when a member is a service,
 *          `mobile` when a member runs on react-native, `infra` when the root runway names AWS (Pulumi), `stackra`
 *          and `figentra` when a manifest reads that scope from the registry (not a workspace member), and `agents` when
 *          the root has `agents:check`.
 * Boundary: pure; reads only the workspace it is given.
 * Runtime: node
 * Governing contract: STA-1952 spec FR-015 and FR-017; ADR 0515.
 */
import { publishedDependency } from "#node/doctor/functions/published-dependency.function";
import type { DoctorNeed } from "#node/doctor/types/doctor-need.type";
import type { DoctorWorkspace } from "#node/doctor/types/doctor-workspace.type";

/** The value as a record, or an empty one. */
const record = (value: unknown): Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

/**
 * The needs of a workspace.
 *
 * @param workspace - the workspace as `readDoctorWorkspace` (or a starter) describes it.
 * @example
 * doctorNeeds({ manifests: [{ stackra: { tier: "service" } }], scripts: {}, devPorts: [] }); // Set { "services" }
 */
export function doctorNeeds(workspace: DoctorWorkspace): ReadonlySet<DoctorNeed> {
  const needs = new Set<DoctorNeed>();
  if (workspace.scripts["agents:check"] !== undefined) needs.add("agents");
  if (record(record(workspace.runway)["providers"])["aws"] !== undefined) needs.add("infra");
  if (publishedDependency(workspace.manifests, "@stackra") !== undefined) needs.add("stackra");
  if (publishedDependency(workspace.manifests, "@figentra") !== undefined) needs.add("figentra");
  for (const manifest of workspace.manifests) {
    const stackra = record(record(manifest)["stackra"]);
    if (stackra["tier"] === "service") needs.add("services");
    const runtimes = stackra["runtimes"];
    if (Array.isArray(runtimes) && runtimes.includes("react-native")) needs.add("mobile");
  }
  return needs;
}
