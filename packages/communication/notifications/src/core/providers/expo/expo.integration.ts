/**
 * Stackra file contract:
 * Purpose: `ExpoIntegration`, Expo's push service for the mobile apps: a platform-only Integration with the access token
 *          of push security, at exp.host.
 * Boundary: description only, no level: the app's push credentials are the platform's, so it is never listed (ADR 0355
 *           decision 2). `DevicePushTransportDriver` calls it.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1: push); ADR 0308 (rules 1 and 4); ADR 0355 (decision 2).
 */
import { Secret } from "@stackra/config";
import { AuthType, Integration, IntegrationCategory, IntegrationRole } from "@stackra/integrations";

/**
 * Expo push.
 *
 * @example
 * const tickets = await expo.api.post<ExpoTickets>("/--/api/v2/push/send", messages);
 */
export class ExpoIntegration extends Integration({
  provider: "expo",
  category: IntegrationCategory.Messaging,
  roles: [IntegrationRole.Channel],
  levels: [],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {accessToken}" },
  baseUrl: "https://exp.host",
}) {
  /** The push security access token. */
  @Secret("EXPO_ACCESS_TOKEN")
  accessToken!: string;
}
