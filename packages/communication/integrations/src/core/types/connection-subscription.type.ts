/**
 * Stackra file contract:
 * Purpose: `ConnectionSubscription`, what a connection's optional `subscribe(webhookUrl)` returns: the webhook signing
 *          secret the provider issued, when it issues one.
 * Boundary: a type only. The store writes the secret into the field the Integration's `webhooks.secret` placeholder
 *           names, so the API path and the console's paste-by-hand path end in the same state.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 17).
 */

/**
 * The result of subscribing a connection's webhook URL at the provider.
 *
 * @example
 * async subscribe(webhookUrl: string): Promise<ConnectionSubscription> {
 *   const hook = await this.api.post<ProviderHook>("/webhooks", { url: webhookUrl });
 *   return { secret: hook.signing_secret };
 * }
 */
export interface ConnectionSubscription {
  /** The signing secret of the subscribed URL. */
  readonly secret?: string;
}
