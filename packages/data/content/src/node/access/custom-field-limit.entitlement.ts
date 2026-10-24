/**
 * Stackra file contract:
 * Purpose: `CustomFieldLimitEntitlement`, the plan right that bounds how many custom fields a scope may define: a
 *          number per plan, `Number.POSITIVE_INFINITY` for no bound.
 * Boundary: declared only. The plan values (ADR 0242) are the entitlement system's data, never here, and this package
 *           registers no call as gated by it: the host's action that calls `CustomFieldService.define` is gated, and
 *           `PlanEntitlementCheckDriver` then counts `CustomField` rows against the grant.
 * Runtime: node
 * Governing contract: ADR 0116 (decision CT2: the number of fields is a plan limit through entitlements); ADR 0215
 *                     (decision 1); ADR 0242.
 */
import { Entitlement, EntitlementKind } from "@stackra/entitlements";

import { CustomField } from "#node/models/custom-field.model";

/** How many custom fields a plan allows; key `content.custom_field_limit`. */
export class CustomFieldLimitEntitlement extends Entitlement({
  kind: EntitlementKind.Limit,
  counts: () => CustomField,
}) {}
