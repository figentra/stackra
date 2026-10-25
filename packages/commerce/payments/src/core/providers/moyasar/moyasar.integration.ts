/**
 * Stackra file contract:
 * Purpose: `MoyasarIntegration`, the description of Moyasar as a payments provider: HTTP Basic with the secret key as
 *          the user name and no password, at api.moyasar.com.
 * Boundary: description only; credentials live on `MoyasarConnection`, which derives the Basic credential from its
 *           secret key (`{basicCredential}`). Live and test share the host and differ by key.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 1, 4 and 13); ADR 0356 (decision 2); ADR 0357 (decision 2); ADR 0358 (d3).
 */
import { AuthType, ConnectionLevel, Integration, IntegrationCategory } from "@stackra/integrations";

/**
 * Moyasar.
 *
 * @example
 * const connection = await store.find(MoyasarConnection);
 */
export class MoyasarIntegration extends Integration({
  provider: "moyasar",
  category: IntegrationCategory.Payments,
  levels: [ConnectionLevel.Scope],
  // The managed client's Basic type needs a password, and Moyasar's is empty, so the header is written whole.
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Basic {basicCredential}" },
  baseUrl: "https://api.moyasar.com",
  health: { every: "6h", failAfter: 3 },
}) {}
