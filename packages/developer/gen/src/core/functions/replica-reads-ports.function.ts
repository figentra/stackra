/**
 * Stackra file contract:
 * Purpose: `replicaReadsPorts`, the `ReplicaReads` port (`@stackra/actions/contracts`) as a token the service's wiring
 *          reaches when one of its queries, or one a hosted package's manifest records, declares `reads: "replica"`,
 *          or when it declares `@stackra/database` and has a query at all (configuration may move any query to a
 *          replica: `DatabaseConfig.replicaReads`, STA-1464), so the wiring writes the port's driver table from the
 *          declared packages' manifests: `@stackra/database`'s `DatabaseReplicaReadsDriver` (driver `database`) with
 *          the `DatabaseConfig` row whose `readYourWrites` is the window (STA-1504).
 * Boundary: pure; reads the IR only. The action pipeline resolves the port optionally (no constructor names it), so
 *           without this token no table is written and replica queries run on the primary. A service only; a package's
 *           own wiring is registered by its tests, which bind what they need.
 * Runtime: isomorphic
 * Governing contract: ADR 0057 (decision 6: read replica); ADR 0263 (gen writes the wiring); STA-1504; STA-1464 (a
 *                     query placed on a replica by configuration).
 */
import type { MemberIR } from "#core/types/member-ir.type";
import type { TokenRef } from "#core/types/token-ref.type";

/** The port a replica query runs through. */
const REPLICA_READS: TokenRef = {
  class: { name: "ReplicaReads", from: "@stackra/actions/contracts" },
};

/**
 * The replica-reads token `ir`'s wiring reaches, or none.
 *
 * @param ir - the member read by discovery.
 * @example
 * replicaReadsPorts(reportsServiceIr); // [{ class: { name: "ReplicaReads", from: "@stackra/actions/contracts" } }]
 */
export function replicaReadsPorts(ir: MemberIR): TokenRef[] {
  const hosted = ir.dependencies
    .filter(({ manifest }) => manifest.kind !== "app")
    .flatMap(({ manifest }) => manifest.actions ?? [])
    .filter((action) => action.kind === "query");
  const own = ir.classes.filter((declared) => declared.kind === "query");
  const declared =
    own.some((query) => query.options["reads"] === "replica") ||
    hosted.some((query) => query["reads"] === "replica");
  // The driver table comes from the database's manifest, so configuration can place a query only where it is declared.
  const configurable =
    ir.dependencies.some((dependency) => dependency.package === "@stackra/database") &&
    own.length + hosted.length > 0;
  return ir.layout === "service" && (declared || configurable) ? [REPLICA_READS] : [];
}
