/**
 * Stackra file contract:
 * Purpose: `DocumensoIntegration`, the provider description of Documenso (`documenso`), the default e-signature
 *          provider (owner decision R2-6, M7): a self-hosted Documenso reached through its public API v1.
 * Boundary: static and the same for every scope: an API key in `Authorization` and a base URL whose host is the
 *           Connection's `host` field, since every deployment runs its own instance. No platform secret: a Connection
 *           always brings its own key. Which Markets offer it is market-pack data, never code (ADR 0356).
 *           Certification pending: written from Documenso's public API v1 documentation and recorded answers, not yet
 *           run against a live instance (owner decision D3).
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 5); ADR 0308 (rules 1, 4 and 9); ADR 0356; owner decision R2-6.
 */
import {
  AuthType,
  ConnectionLevel,
  Integration,
  IntegrationCategory,
  IntegrationRole,
} from "@stackra/integrations";

/**
 * Describes how a Connection reaches a self-hosted Documenso instance for e-signature.
 *
 * @example
 * const SIGNING: ProviderDrivers<ESignatureConnection> = { documenso: DocumensoConnection };
 */
export class DocumensoIntegration extends Integration({
  provider: "documenso",
  category: IntegrationCategory.DocumentManagement,
  roles: [IntegrationRole.Driver],
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "{apiKey}" },
  baseUrl: "https://{host}/api/v1",
}) {}
