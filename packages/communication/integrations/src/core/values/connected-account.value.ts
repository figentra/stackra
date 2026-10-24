/**
 * Stackra file contract:
 * Purpose: `ConnectedAccount`, what a connection's `check()` returns: the provider account the credentials act as,
 *          its id (which webhooks and the health check route by) and the label the console shows.
 * Boundary: a value class built with `ConnectedAccount.create({ id, label })` (ADR 0328 decision 1), frozen. An empty
 *           id is a programming error, so `create` throws a `TypeError`, never a refusal (ADR 0328 decision 6). The
 *           label is the provider's account name or domain, never a credential.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 14: `check()` returns the account identity); ADR 0328 (decisions 1 and 6).
 */

/**
 * The provider account a connection acts as.
 *
 * @example
 * async check(): Promise<ConnectedAccount> {
 *   const me = await this.api.get<ProviderAccount>("/me");
 *   return ConnectedAccount.create({ id: me.id, label: me.name });
 * }
 */
export class ConnectedAccount {
  /** The provider's id of the account. */
  readonly id: string;

  /** What the console shows for it; the id when the provider gives no name. */
  readonly label: string;

  private constructor(id: string, label: string) {
    this.id = id;
    this.label = label;
  }

  /**
   * The account with `id` and `label`.
   *
   * @throws TypeError when `id` is empty.
   */
  static create(fields: { readonly id: string; readonly label?: string }): ConnectedAccount {
    if (typeof fields?.id !== "string" || fields.id === "")
      throw new TypeError("ConnectedAccount.create({ id }) needs the provider's account id");
    return Object.freeze(new ConnectedAccount(fields.id, fields.label ?? fields.id));
  }
}
