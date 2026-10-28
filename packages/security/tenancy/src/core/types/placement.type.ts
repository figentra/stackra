/**
 * Stackra file contract:
 * Purpose: `Placement`, where a tenant lives: the runway region key it was placed in at sign-up (`eu`, `me`) and the
 *          cell inside that region whose connection set serves it (`primary` until cells exist). These are the
 *          tenant's `region` and `cell` fields.
 * Boundary: a type only. The tenant registry (the OS tenancy service) stores it on the tenant row and answers it
 *           through `TenantPlacement`; the region is fixed at sign-up (ADR 0353 d1), the cell changes only by a move
 *           job (stackra-322). A cell is a `ConnectionResolver` connection-set name.
 * Runtime: isomorphic
 * Governing contract: ADR 0172 (decision 3: a tenant region from the first migration); ADR 0353 (decisions 1 and 2);
 *                     ADR 0186 (decision 6: cells later, "data plus a picker"); stackra-310.
 */

/** A tenant's region and cell. */
export interface Placement {
  /** The runway region key the tenant was placed in (`eu`, `me`). */
  readonly region: string;

  /** The cell, a connection-set name; `PRIMARY_CONNECTION` (`primary`) until cells exist. */
  readonly cell: string;
}
