/**
 * Stackra file contract:
 * Purpose: `DELETE_FILTERS`, the two named ORM filters of the keep-the-row delete policies: `deleted` hides the rows a
 *          `SoftDeletes` model soft-deleted (`deletedAt` set), `archived` the rows an `Archivable` model archived.
 * Boundary: internal; read by `deleteFilters` (the drivers' `connect`), `CrudService` (`withDeleted`, `onlyDeleted`,
 *           `delete`, `restore`, `forceDelete`, `purge`) and nothing else. The trait names are @stackra/model's registry
 *           names; the field is the trait's.
 * Runtime: isomorphic
 * Governing contract: ADR 0134 (decision 4: the three delete policies); ADR 0321 (`SoftDeletes`, `Archivable`).
 */

/** Each filter: the trait that turns it on and the timestamp field it reads. */
export const DELETE_FILTERS = Object.freeze({
  deleted: Object.freeze({ trait: "soft_deletes", field: "deletedAt" }),
  archived: Object.freeze({ trait: "archivable", field: "archivedAt" }),
});
