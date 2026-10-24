/**
 * Stackra file contract:
 * Purpose: `QueryPersisterName`, the driver names of the `QueryPersister` port this package ships (`storage`),
 *          registered under the port key `query.QueryPersister` so a `DriverName<QueryPersister>` value type-checks
 *          before any host's gen has run.
 * Boundary: a type and the `DriverRegistry` augmentation, with exactly the names of the drivers in `core/drivers/`
 *           (named by their file prefix), so gen's declaration for a host agrees.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4); ADR 0263 (decision 9); ADR 0256 (storage behind the persister).
 */

/** The drivers of `QueryPersister`. */
export type QueryPersisterName = "storage";

declare module "@stackra/container" {
  interface DriverRegistry {
    "query.QueryPersister": QueryPersisterName;
  }
}
