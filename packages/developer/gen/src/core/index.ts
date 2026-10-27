/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/gen, the pure compiler (identities, the manifest and its checks,
 *          the shape compiler, wiring, the member module, entries, the entity files, registrations, boot, the inbound
 *          webhook route, prefixes, an app's route tables and blocks, the generated service clients, the tool configs,
 *          the openapi projection, the docs-site target and its `DocsConfig` base, the public id prefix registry and
 *          the IR types, the surface targets and the extension bundle's modulepreload list), until `stackra gen` writes the
 *          entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Isomorphic: no file system and no TypeScript host here; those
 *           are `./node`. The case helpers, the import printer and the emitters' path helpers stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note (`ir`
 *                     and `source` fold into gen); ADR 0438 (the slot and fill IR types, stackra-03); ADR 0436 (surface targets, the
 *                     extension bundle manifest and `modulepreloadOf`, stackra-04); ADR 0336 (`additionsOf`,
 *                     `AdditionEntry`, stackra-64).
 */
export { DocsConfig } from "#core/bases/docs-config.base";
export { CLIENTS_SPECIFIER } from "#core/constants/clients-specifier.constant";
export { DOCS_CONFIG_FILE } from "#core/constants/docs-config-file.constant";
export { DOCS_SITE_DIR } from "#core/constants/docs-site-dir.constant";
export { EFFECT_TAGS } from "#core/constants/effect-tags.constant";
export { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";
export { INTEGRATION_ROLES } from "#core/constants/integration-roles.constant";
export { MANIFEST_NOTICE } from "#core/constants/manifest-notice.constant";
export { PUBLIC_ID_PREFIXES } from "#core/constants/public-id-prefixes.constant";
export { actionKey } from "#core/functions/action-key.function";
export { additionsOf } from "#core/functions/additions-of.function";
export { blockKey } from "#core/functions/block-key.function";
export { buildManifest } from "#core/functions/build-manifest.function";
export { checkIdentityLock } from "#core/functions/check-identity-lock.function";
export { checkSurfaces } from "#core/functions/check-surfaces.function";
export { compareManifests } from "#core/functions/compare-manifests.function";
export { configKeyOf } from "#core/functions/config-key-of.function";
export { cronJobId } from "#core/functions/cron-job-id.function";
export { deriveEndpoint } from "#core/functions/derive-endpoint.function";
export { driverName } from "#core/functions/driver-name.function";
export { egressOf } from "#core/functions/egress-of.function";
export { emitBlocks } from "#core/functions/emit-blocks.function";
export { emitBoot } from "#core/functions/emit-boot.function";
export { emitClients } from "#core/functions/emit-clients.function";
export { emitDocsSite } from "#core/functions/emit-docs-site.function";
export { emitEncoreCronJobs } from "#core/functions/emit-encore-cron-jobs.function";
export { emitEncoreQueues } from "#core/functions/emit-encore-queues.function";
export { emitEntities } from "#core/functions/emit-entities.function";
export { emitI18n } from "#core/functions/emit-i18n.function";
export { emitMemberModule } from "#core/functions/emit-member-module.function";
export { emitPackageEntries } from "#core/functions/emit-package-entries.function";
export { emitPrefixes } from "#core/functions/emit-prefixes.function";
export { emitRegistrations } from "#core/functions/emit-registrations.function";
export { emitRoutes } from "#core/functions/emit-routes.function";
export { emitRuntimeEntries } from "#core/functions/emit-runtime-entries.function";
export { emitSchemas } from "#core/functions/emit-schemas.function";
export { emitSdks } from "#core/functions/emit-sdks.function";
export { emitToolConfigs } from "#core/functions/emit-tool-configs.function";
export { emitWebhooks } from "#core/functions/emit-webhooks.function";
export { emitWiring } from "#core/functions/emit-wiring.function";
export { eventName } from "#core/functions/event-name.function";
export { folderKey } from "#core/functions/folder-key.function";
export { formatGenError } from "#core/functions/format-gen-error.function";
export { generateMember } from "#core/functions/generate-member.function";
export { integrationKey } from "#core/functions/integration-key.function";
export { jsonSchemaOf } from "#core/functions/json-schema-of.function";
export { modelKey } from "#core/functions/model-key.function";
export { modulepreloadOf } from "#core/functions/modulepreload-of.function";
export { openApiOf } from "#core/functions/open-api-of.function";
export { permissionKey } from "#core/functions/permission-key.function";
export { portKey } from "#core/functions/port-key.function";
export { rootModuleOf } from "#core/functions/root-module-of.function";
export { routeKey } from "#core/functions/route-key.function";
export { sequenceKey } from "#core/functions/sequence-key.function";
export { surfacesOf } from "#core/functions/surfaces-of.function";
export { tableName } from "#core/functions/table-name.function";
export { toolHints } from "#core/functions/tool-hints.function";
export { toolName } from "#core/functions/tool-name.function";
export { webhookPath } from "#core/functions/webhook-path.function";
export type { AdditionEntry } from "#core/types/addition-entry.type";
export type { ClassRef } from "#core/types/class-ref.type";
export type { ClassValue } from "#core/types/class-value.type";
export type { DeclaredClass } from "#core/types/declared-class.type";
export type { Endpoint } from "#core/types/endpoint.type";
export type { DocsGroup } from "#core/types/docs-group.type";
export type { DocsLink } from "#core/types/docs-link.type";
export type { DocsSiteInput } from "#core/types/docs-site-input.type";
export type { DocsSite } from "#core/types/docs-site.type";
export type { DocsTab } from "#core/types/docs-tab.type";
export type { EntityIR } from "#core/types/entity-ir.type";
export type { ExtensionBundleManifest } from "#core/types/extension-bundle-manifest.type";
export type { EnumIR } from "#core/types/enum-ir.type";
export type { FacetUse } from "#core/types/facet-use.type";
export type { FieldDefault } from "#core/types/field-default.type";
export type { FieldIR } from "#core/types/field-ir.type";
export type { FieldRule } from "#core/types/field-rule.type";
export type { FileExports } from "#core/types/file-exports.type";
export type { GenError } from "#core/types/gen-error.type";
export type { GeneratedFile } from "#core/types/generated-file.type";
export type { ManifestBreak } from "#core/types/manifest-break.type";
export type { MemberIR } from "#core/types/member-ir.type";
export type { OpenApiDocument } from "#core/types/open-api-document.type";
export type { RegexValue } from "#core/types/regex-value.type";
export type { RelationIR } from "#core/types/relation-ir.type";
export type { ShapeIR } from "#core/types/shape-ir.type";
export type { SlotFillIR } from "#core/types/slot-fill-ir.type";
export type { SlotIR } from "#core/types/slot-ir.type";
export type { SurfaceTarget } from "#core/types/surface-target.type";
export type { TokenRef } from "#core/types/token-ref.type";
export type { ToolHints } from "#core/types/tool-hints.type";
export type { TypeDesc } from "#core/types/type-desc.type";
