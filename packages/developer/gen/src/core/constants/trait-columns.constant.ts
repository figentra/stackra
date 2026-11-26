/**
 * Stackra file contract:
 * Purpose: `TRAIT_COLUMNS`, the columns and indexes each column-writing model trait's migration macro writes, keyed by
 *          the trait's registry code (the name `createTrait` records and `traitsOf` returns): `has_public_id`
 *          (`t.hasPublicId`), `timestamps`, `user_stamps`, `soft_deletes`, `archivable`, `versioned`, `has_tree`
 *          (`t.tree()`: `parent_id`, the `ltree` `tree_path` and its GiST index), `has_metadata` (`t.metadata()`: the
 *          jsonb bag and its optional GIN index), `belongs_to_tenant` and `belongs_to_tenant_or_platform`
 *          (`t.belongsToTenant`), and `has_owner` (`t.owner()`).
 * Boundary: data only, mirroring the `Blueprint` of @stackra/database and the tenancy and iam macros, which gen cannot
 *           import; a public id is `varchar(33)`, as `expectedSchema` writes it. A trait that writes no column of its
 *           own (`append_only`, `has_revisions`, a marker) has no row, and `partitioned` is read from its options by
 *           `traitColumnsOf`. A new column-writing trait adds its row here with its macro.
 * Runtime: isomorphic
 * Governing contract: ADR 0096 (decision 4: the trait registry); ADR 0133 (decision 7: user stamps); ADR 0134
 *                     (decision 4: delete policies); ADR 0321 (decisions 2 and 4: `HasTree`, `HasMetadata`); ADR 0135
 *                     (public ids are `varchar(33)`); ADR 0239 (decision 1: the tenant column); STA-1408.
 */
import type { TraitColumns } from "#core/types/trait-columns.type";

/** A public id column. */
const PUBLIC_ID = "varchar(33)";

/** The column-writing traits, by registry code. */
export const TRAIT_COLUMNS: Readonly<Record<string, TraitColumns>> = Object.freeze({
  has_public_id: { columns: [{ name: "id", type: PUBLIC_ID, nullable: false }], indexes: [] },
  timestamps: {
    columns: [
      { name: "created_at", type: "timestamptz", nullable: false },
      { name: "updated_at", type: "timestamptz", nullable: false },
    ],
    indexes: [],
  },
  user_stamps: {
    columns: [
      { name: "created_by", type: PUBLIC_ID, nullable: true },
      { name: "updated_by", type: PUBLIC_ID, nullable: true },
    ],
    indexes: [],
  },
  soft_deletes: {
    columns: [{ name: "deleted_at", type: "timestamptz", nullable: true }],
    indexes: [],
  },
  archivable: {
    columns: [{ name: "archived_at", type: "timestamptz", nullable: true }],
    indexes: [],
  },
  versioned: { columns: [{ name: "version", type: "integer", nullable: false }], indexes: [] },
  has_tree: {
    columns: [
      { name: "parent_id", type: PUBLIC_ID, nullable: true },
      // Not null on a new table; nullable on an existing one until a backfill writes every path.
      { name: "tree_path", type: "ltree", nullable: "either" },
    ],
    indexes: [{ columns: ["tree_path"], method: "gist" }],
  },
  has_metadata: {
    columns: [{ name: "metadata", type: "jsonb", nullable: false }],
    indexes: [{ columns: ["metadata"], method: "gin", optional: true }],
  },
  belongs_to_tenant: {
    columns: [{ name: "tenant_id", type: PUBLIC_ID, nullable: false }],
    indexes: [],
  },
  belongs_to_tenant_or_platform: {
    columns: [{ name: "tenant_id", type: PUBLIC_ID, nullable: true }],
    indexes: [],
  },
  has_owner: { columns: [{ name: "owner_id", type: PUBLIC_ID, nullable: true }], indexes: [] },
});
