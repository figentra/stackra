/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/errors, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `ErrorReporter` is not here: it is exported from `./contracts`
 *           only (ADR 0294 decision 15: one symbol, one entry).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { SentryConfig } from "#config/sentry.config";
export { Refusal } from "#core/bases/refusal.base";
export { CoreRefusals } from "#core/constants/core-refusals.constant";
export { SENTRY_CONFIG_SCHEMA as SentryConfig$ } from "#core/constants/sentry-config-schema.constant";
export { MemoryErrorReporterDriver } from "#core/drivers/memory-error-reporter.driver";
export { SentryErrorReporterDriver } from "#core/drivers/sentry-error-reporter.driver";
export { ErrorKind } from "#core/enums/error-kind.enum";
export { BridgeRejectedError } from "#core/errors/bridge-rejected.error";
export { EntitlementRequiredError } from "#core/errors/entitlement-required.error";
export { ForbiddenError } from "#core/errors/forbidden.error";
export { IdempotencyKeyReusedError } from "#core/errors/idempotency-key-reused.error";
export { LiveReadOnlyError } from "#core/errors/live-read-only.error";
export { NotFoundError } from "#core/errors/not-found.error";
export { RateLimitedError } from "#core/errors/rate-limited.error";
export { UnauthenticatedError } from "#core/errors/unauthenticated.error";
export { WorkflowTimedOutError } from "#core/errors/workflow-timed-out.error";
export { isRefusal } from "#core/functions/is-refusal.function";
export { refusalCode } from "#core/functions/refusal-code.function";
export { SentryOptions } from "#core/schemas/sentry-options.schema";
export type { ErrorCategory } from "#core/types/error-category.type";
export type { ErrorEnvelope } from "#core/types/error-envelope.type";
export type { FieldErrors } from "#core/types/field-errors.type";
export type { RefusalClass } from "#core/types/refusal-class.type";
export type { RefusalDetails } from "#core/types/refusal-details.type";
export type { RefusalOptions } from "#core/types/refusal-options.type";
