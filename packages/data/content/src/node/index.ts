/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/content (the `HasCustomFields` trait, the `CustomField` and
 *          `CustomFieldValueSet` models, `CustomFieldService` and the custom field limit entitlement) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: it reaches MikroORM through @stackra/model and
 *           @stackra/database. The migration is found by its path, as every migration is, so it is not re-exported.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0116 (decision CT2); the STA-347 stand-in barrel decision.
 */
export { CustomFieldLimitEntitlement } from "#node/access/custom-field-limit.entitlement";
export { CustomField } from "#node/models/custom-field.model";
export { CustomFieldValueSet } from "#node/models/custom-field-value-set.model";
export { CustomFieldService } from "#node/services/custom-field.service";
export { HasCustomFields } from "#node/traits/has-custom-fields.trait";
