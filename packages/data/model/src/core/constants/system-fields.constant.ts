/**
 * Stackra file contract:
 * Purpose: `SYSTEM_FIELDS`, the fields the system writes on a model, by the trait that declares them: the public id,
 *          the timestamps, the user stamps, the delete-policy markers, the optimistic-lock version and a tree's path. A caller never
 *          sets them; `CrudService` refuses a write that does (stackra-287), and a resource's create input leaves
 *          them out.
 * Boundary: data only, keyed by trait registry name, so a model's own field of the same name (a catalogue's
 *           `version`, a thread's `createdBy`) is not a system field unless the trait is on the model;
 *           `systemFieldsOf(model)` reads it against the model's traits. One list: experience/panel's `CreateInput`
 *           derives its `SystemField` from here.
 * Runtime: isomorphic
 * Governing contract: ADR 0133 (decision 7: user stamps); ADR 0134 (decision 4: delete policies); ADR 0096; data-layer
 *                     gap mo21 (stackra-287); mo16 (`HasTree`).
 */

/** The system-written fields of each trait that declares some. */
export const SYSTEM_FIELDS = Object.freeze({
  has_public_id: Object.freeze(["id"] as const),
  timestamps: Object.freeze(["createdAt", "updatedAt"] as const),
  user_stamps: Object.freeze(["createdBy", "updatedBy"] as const),
  soft_deletes: Object.freeze(["deletedAt"] as const),
  archivable: Object.freeze(["archivedAt"] as const),
  versioned: Object.freeze(["version"] as const),
  has_tree: Object.freeze(["treePath"] as const),
});
