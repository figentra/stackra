/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/content (`ContentModule`, the `HasCustomFields`,
 *          `HasRevisions`, `Publishable`, `Sluggable` and `Schedulable` traits, `RevisionService`, the `CustomField`,
 *          `CustomFieldValueSet` and `Revision` models, `CustomFieldService` and the custom field limit entitlement)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: it reaches MikroORM through @stackra/model and
 *           @stackra/database. The migrations are found by their paths, as every migration is, so none is re-exported.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0116 (decision CT2); ADR 0321 (decision 2); the STA-347 stand-in
 *                     barrel decision.
 */
export { ContentModule } from "#node/content.module";
export { CustomFieldLimitEntitlement } from "#node/access/custom-field-limit.entitlement";
export { CustomField } from "#node/models/custom-field.model";
export { CustomFieldValueSet } from "#node/models/custom-field-value-set.model";
export { Revision } from "#node/models/revision.model";
export { CustomFieldService } from "#node/services/custom-field.service";
export { RevisionService } from "#node/services/revision.service";
export { HasCustomFields } from "#node/traits/has-custom-fields.trait";
export { HasRevisions } from "#node/traits/has-revisions.trait";
export { Publishable } from "#node/traits/publishable.trait";
export { Schedulable } from "#node/traits/schedulable.trait";
export { Sluggable } from "#node/traits/sluggable.trait";
