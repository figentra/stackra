/**
 * Stackra file contract:
 * Purpose: `TamaraSandboxIntegration`, Tamara's sandbox host (api-sandbox.tamara.co) as its own Integration, so a
 *          sandbox tenant's test-mode gateway never reaches the live host.
 * Boundary: description only; the same options as `TamaraIntegration` but the base URL and provider code.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 11); ADR 0308 (rule 1).
 */
import { AuthType, ConnectionLevel, Integration, IntegrationCategory } from "@stackra/integrations";

/**
 * Tamara, sandbox.
 *
 * @example
 * const connection = await store.find(TamaraSandboxConnection);
 */
export class TamaraSandboxIntegration extends Integration({
  provider: "tamara-sandbox",
  category: IntegrationCategory.Payments,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {apiToken}" },
  baseUrl: "https://api-sandbox.tamara.co",
  health: { every: "6h", failAfter: 3 },
}) {}
