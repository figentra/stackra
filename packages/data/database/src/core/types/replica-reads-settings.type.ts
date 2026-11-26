/**
 * Stackra file contract:
 * Purpose: `ReplicaReadsSettings`, how a service reads its replicas (`DatabaseConfig.replicaReads`): the replica lag a
 *          replica query tolerates when its code names none (`maxLag`), how long one lag reading of a replica is reused
 *          (`probeEvery`), and where queries read whatever their code declares, per query key (`queries`) and per API
 *          area (`areas`), the key winning over the area.
 * Boundary: a type only. Values come from configuration; `DatabaseReplicaReadsDriver` reads the defaults and the
 *           overrides, the boot hands `probeEvery` to `PostgresDatabaseDriver.connect` as `replicaProbe`.
 * Runtime: isomorphic
 * Governing contract: ADR 0057 (decision 6: read replica); data-layer gap scale-performance 11 (stackra-307,
 *                     STA-1464: replica reads by declaration, set by configuration, with a lag guard).
 */
import type { ApiArea, Duration } from "@stackra/contracts";

/** Replica reads of one service. */
export interface ReplicaReadsSettings {
  /** The most replica lag a replica query tolerates when its code declares no `maxLag`. */
  readonly maxLag: Duration;

  /** How long one reading of a replica's lag is reused before the replica is asked again. */
  readonly probeEvery: Duration;

  /** Where a query reads, by its key (`visit.list`), whatever its code declares. */
  readonly queries: Record<string, "primary" | "replica">;

  /** Where the queries of an API area read, whatever their code declares, unless their key is listed. */
  readonly areas: Partial<Record<ApiArea, "primary" | "replica">>;
}
