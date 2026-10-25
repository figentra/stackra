/**
 * Stackra file contract:
 * Purpose: `SesIntegration`, Amazon SES (API v2) as a mail provider, at the region's endpoint
 *          (`email.<region>.amazonaws.com`), each request signed with AWS Signature Version 4 by the connection.
 * Boundary: description only. SigV4 is not one of the managed client's six auth types, so `auth` is `none` and the
 *           connection signs its own requests (ADR 0308 rule 8). The region is the connection's field, chosen by the
 *           data-residency rules of the deployment, never code.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 1 and 8); ADR 0356; ADR 0355 (decision 1).
 */
import {
  ConnectionLevel,
  AuthType,
  Integration,
  IntegrationCategory,
  IntegrationRole,
} from "@stackra/integrations";

/**
 * Amazon SES.
 *
 * @example
 * const ses = await store.find(SesConnection);
 */
export class SesIntegration extends Integration({
  provider: "ses",
  category: IntegrationCategory.Email,
  roles: [IntegrationRole.Channel],
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.None },
  baseUrl: "https://email.{region}.amazonaws.com",
  health: { every: "6h", failAfter: 3 },
}) {}
