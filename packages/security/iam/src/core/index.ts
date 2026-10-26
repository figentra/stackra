/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/iam (the Permissions, Permission, Policy and Role kinds,
 *          Decision, Risk, SystemRole and AccessReason, the decision point, the pipeline and scope drivers, the memory
 *          and store-backed sources, the field, break-glass, dimension and existence helpers, the client's permission
 *          snapshot and the registration functions gen's entry calls) until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing. The port and the snapshot types are exported from
 *           `./contracts` only (ADR 0294 decision 15: one symbol, one entry). Nothing here imports `node:`, so browser
 *           bundles may import the enums and the snapshot service.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { Permissions } from "#core/bases/permissions.base";
export { Policy } from "#core/bases/policy.base";
export { Role } from "#core/bases/role.base";
export { IamAccessControlDriver } from "#core/drivers/iam-access-control.driver";
export { IamGrantedScopesDriver } from "#core/drivers/iam-granted-scopes.driver";
export { MemoryPolicySnapshotStoreDriver } from "#core/drivers/memory-policy-snapshot-store.driver";
export { MemoryPolicySourceDriver } from "#core/drivers/memory-policy-source.driver";
export { StorePolicySourceDriver } from "#core/drivers/store-policy-source.driver";
export { AccessReason } from "#core/enums/access-reason.enum";
export { Decision } from "#core/enums/decision.enum";
export { Risk } from "#core/enums/risk.enum";
export { SystemRole } from "#core/enums/system-role.enum";
export { assertFieldsWritable } from "#core/functions/assert-fields-writable.function";
export { breakGlassGrant } from "#core/functions/break-glass-grant.function";
export { connectPolicies } from "#core/functions/connect-policies.function";
export { decodePolicySnapshot } from "#core/functions/decode-policy-snapshot.function";
export { existenceHit } from "#core/functions/existence-hit.function";
export { permissionKey } from "#core/functions/permission-key.function";
export { redactFields } from "#core/functions/redact-fields.function";
export { registerDimensions } from "#core/functions/register-dimensions.function";
export { registerPermissions } from "#core/functions/register-permissions.function";
export { registerPolicies } from "#core/functions/register-policies.function";
export { registerRoles } from "#core/functions/register-roles.function";
export { PermissionSnapshotService } from "#core/services/permission-snapshot.service";
export { PolicyDecisionPointService } from "#core/services/policy-decision-point.service";
export { PolicySnapshotIntakeService } from "#core/services/policy-snapshot-intake.service";
export { Permission } from "#core/values/permission.value";
export type { AccessExplanation } from "#core/types/access-explanation.type";
export type { CheckOptions } from "#core/types/check-options.type";
export type { DimensionRegistration } from "#core/types/dimension-registration.type";
export type { FieldPermissions } from "#core/types/field-permissions.type";
export type { MemoryPolicyState } from "#core/types/memory-policy-state.type";
export type { PermissionRegistration } from "#core/types/permission-registration.type";
export type { PolicyOptions } from "#core/types/policy-options.type";
export type { PolicyRegistration } from "#core/types/policy-registration.type";
export type { PolicySnapshotEvent } from "#core/types/policy-snapshot-event.type";
export type { RecordFacts } from "#core/types/record-facts.type";
export type { RoleOptions } from "#core/types/role-options.type";
export type { RoleRegistration } from "#core/types/role-registration.type";
export type { SearchHit } from "#core/types/search-hit.type";
export type { VisibleConditionOptions } from "#core/types/visible-condition-options.type";
