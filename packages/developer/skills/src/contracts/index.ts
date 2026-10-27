/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/skills until `stackra gen` writes the entry barrels
 *          (STA-339): the registry item kinds (`StackraKind`), the `stackra` field (`StackraManifest`) and its package
 *          vocabularies (`StackraTier`, `StackraCategory`, `StackraRuntime`), the catalogue
 *          API shapes (`CatalogueItem`, `CataloguePage`), the `stackra-items.lock.yaml` shape (`ItemsLock`) and their
 *          schemas, shared by the registry Worker and the CLI.
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0453 (decisions 11 and 12); the STA-347 stand-in barrel decision.
 */
export { CATALOGUE_ITEM_SCHEMA } from "#contracts/constants/catalogue-item-schema.constant";
export { CATALOGUE_PAGE_SCHEMA } from "#contracts/constants/catalogue-page-schema.constant";
export { ITEM_PACKAGE_NAME_PATTERN } from "#contracts/constants/item-package-name-pattern.constant";
export { ITEMS_LOCK_SCHEMA } from "#contracts/constants/items-lock-schema.constant";
export { STACKRA_MANIFEST_SCHEMA } from "#contracts/constants/stackra-manifest-schema.constant";
export { StackraCategory } from "#contracts/enums/stackra-category.enum";
export { StackraKind } from "#contracts/enums/stackra-kind.enum";
export { StackraRuntime } from "#contracts/enums/stackra-runtime.enum";
export { StackraTier } from "#contracts/enums/stackra-tier.enum";
export type { CatalogueItem } from "#contracts/types/catalogue-item.type";
export type { CataloguePage } from "#contracts/types/catalogue-page.type";
export type { ItemsLock } from "#contracts/types/items-lock.type";
export type { ItemsLockEntry } from "#contracts/types/items-lock-entry.type";
export type { StackraManifest } from "#contracts/types/stackra-manifest.type";
