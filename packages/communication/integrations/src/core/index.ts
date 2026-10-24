/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/integrations, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The managed client's internals (`managedClient`, the placeholder
 *           lookup, the token calls, the JWT signer) and the registries stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { Connection } from "#core/bases/connection.base";
export { Integration } from "#core/bases/integration.base";
export { HostedConnectionStoreDriver } from "#core/drivers/hosted-connection-store.driver";
export { LocalConnectionStoreDriver } from "#core/drivers/local-connection-store.driver";
export { AuthType } from "#core/enums/auth-type.enum";
export { ConnectionLevel } from "#core/enums/connection-level.enum";
export { IntegrationCategory } from "#core/enums/integration-category.enum";
export { RateLimitScope } from "#core/enums/rate-limit-scope.enum";
export { ConnectionAmbiguousError } from "#core/errors/connection-ambiguous.error";
export { ConnectionCheckFailedError } from "#core/errors/connection-check-failed.error";
export { InvalidSignatureError } from "#core/errors/invalid-signature.error";
export { ProviderRefusedError } from "#core/errors/provider-refused.error";
export { ProviderUnavailableError } from "#core/errors/provider-unavailable.error";
export { registerConnections } from "#core/functions/register-connections.function";
export { resolvePlaceholders } from "#core/functions/resolve-placeholders.function";
export { ConnectionContext } from "#core/ports/connection-context.port";
export { ConnectionHost } from "#core/ports/connection-host.port";
export { ConnectionStore } from "#core/ports/connection-store.port";
export { IntegrationRuntime } from "#core/services/integration-runtime.service";
export { ConnectedAccount } from "#core/values/connected-account.value";
export type { AuthOptions } from "#core/types/auth-options.type";
export type { ConnectInput } from "#core/types/connect-input.type";
export type { ConnectionClass } from "#core/types/connection-class.type";
export type { ConnectionFields } from "#core/types/connection-fields.type";
export type { ConnectionRecord } from "#core/types/connection-record.type";
export type { ConnectionRegistration } from "#core/types/connection-registration.type";
export type { ConnectionSubscription } from "#core/types/connection-subscription.type";
export type { ConnectionWebhooks } from "#core/types/connection-webhooks.type";
export type { HealthCheck } from "#core/types/health-check.type";
export type { IntegrationApi } from "#core/types/integration-api.type";
export type { IntegrationClass } from "#core/types/integration-class.type";
export type { IntegrationListing } from "#core/types/integration-listing.type";
export type { IntegrationOptions } from "#core/types/integration-options.type";
export type { IntegrationWebhooks } from "#core/types/integration-webhooks.type";
export type { Interval } from "#core/types/interval.type";
export type { OAuthTokens } from "#core/types/oauth-tokens.type";
export type { RateLimit } from "#core/types/rate-limit.type";
export type { RequestOptions } from "#core/types/request-options.type";
export type { RetryPolicy } from "#core/types/retry-policy.type";
