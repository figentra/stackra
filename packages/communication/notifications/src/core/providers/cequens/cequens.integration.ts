/**
 * Stackra file contract:
 * Purpose: `CequensIntegration`, Cequens as an SMS provider: a Bearer API token at apis.cequens.com.
 * Boundary: description only. Which Markets offer Cequens is market-pack data (OS-186).
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 1 and 4); ADR 0356; row "Cequens SMS" of the package needs.
 */
import { Secret } from "@stackra/config";
import {
  AuthType,
  ConnectionLevel,
  Integration,
  IntegrationCategory,
  IntegrationRole,
} from "@stackra/integrations";

/**
 * Cequens.
 *
 * @example
 * const cequens = await store.find(CequensConnection);
 */
export class CequensIntegration extends Integration({
  provider: "cequens",
  category: IntegrationCategory.Messaging,
  roles: [IntegrationRole.Channel],
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {apiToken}" },
  baseUrl: "https://apis.cequens.com",
  health: { every: "6h", failAfter: 3 },
}) {
  /** The platform's token, for platform-provided SMS. */
  @Secret("CEQUENS_API_TOKEN")
  apiToken!: string;
}
