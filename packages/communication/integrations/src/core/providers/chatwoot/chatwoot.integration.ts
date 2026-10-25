/**
 * Stackra file contract:
 * Purpose: `ChatwootIntegration`, the headless Chatwoot the platform runs per region (the customer inbox behind OS
 *          messaging), and its Platform API: provision a tenant's account with an administrator user whose token the
 *          tenant's `ChatwootConnection` keeps.
 * Boundary: the host and the platform app token are platform secrets read blind at call time (`CHATWOOT_HOST`,
 *           `CHATWOOT_PLATFORM_TOKEN`): each region's deployment has its own, so data stays in its region. The tenant's
 *           connection fills `{accessToken}` with its own user's token (ADR 0308 rule 4). Chatwoot's UI is never shown;
 *           OS messaging drives it through the API.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 1, 4 and 13); ADR 0355 (decision 1); OS-204, OS-206.
 */
import { Secret } from "@stackra/config";

import { Integration } from "#core/bases/integration.base";
import { AuthType } from "#core/enums/auth-type.enum";
import { ConnectionLevel } from "#core/enums/connection-level.enum";
import { IntegrationCategory } from "#core/enums/integration-category.enum";
import { IntegrationRole } from "#core/enums/integration-role.enum";

/** What a provisioned tenant account is. */
interface ChatwootProvisioned {
  /** The Chatwoot account id. */
  readonly accountId: string;

  /** The administrator user's id. */
  readonly userId: string;

  /** The administrator user's API token, for the tenant's connection; never logged. */
  readonly accessToken: string;
}

/**
 * Chatwoot, headless.
 *
 * @example
 * const { accountId, accessToken } = await chatwoot.provision({ name: tenant.name, locale: "ar", email });
 * await store.connect(ChatwootConnection, { level: ConnectionLevel.Scope, fields: { accountId, accessToken } });
 */
export class ChatwootIntegration extends Integration({
  provider: "chatwoot",
  category: IntegrationCategory.Messaging,
  roles: [IntegrationRole.Driver],
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "api_access_token", format: "{accessToken}" },
  baseUrl: "https://{chatwootHost}",
  health: { every: "6h", failAfter: 3 },
}) {
  /** The region's Chatwoot host (`inbox.gcc.example`). */
  @Secret("CHATWOOT_HOST")
  chatwootHost!: string;

  /** The platform app's token. */
  @Secret("CHATWOOT_PLATFORM_TOKEN")
  accessToken!: string;

  /**
   * Creates a tenant's account and its administrator user, and links them.
   *
   * @param input.email - the administrator user's address, a platform-owned mailbox, never a person's.
   */
  async provision(input: {
    readonly name: string;
    readonly locale: string;
    readonly email: string;
  }): Promise<ChatwootProvisioned> {
    const account = await this.api.post<{ readonly id: number }>("/platform/api/v1/accounts", {
      name: input.name,
      locale: input.locale,
    });
    const user = await this.api.post<{ readonly id: number; readonly access_token: string }>(
      "/platform/api/v1/users",
      // The user never signs in; the suffix meets Chatwoot's password rule.
      { name: input.name, email: input.email, password: `${crypto.randomUUID()}Aa1!` },
    );
    await this.api.post(`/platform/api/v1/accounts/${account.id}/account_users`, {
      user_id: user.id,
      role: "administrator",
    });
    return {
      accountId: String(account.id),
      userId: String(user.id),
      accessToken: user.access_token,
    };
  }

  /** Deletes a tenant's account and everything in it (offboarding, after the retention window). */
  async deprovision(accountId: string): Promise<void> {
    await this.api.delete(`/platform/api/v1/accounts/${accountId}`);
  }
}
