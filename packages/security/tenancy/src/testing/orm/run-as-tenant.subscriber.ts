/**
 * Stackra file contract:
 * Purpose: `RunAsTenantSubscriber`, the ORM subscriber of `runAsTenant(T, work)`: it refuses the flush of a new
 *          `BelongsToTenant` row created inside `work` whose `tenantId` is not `T` (the trait fills `tenantId` only as a
 *          field default, so a factory `definition()`, `create()` attributes or a repository insert that sets it
 *          silently wins and a test arranges rows in a tenant it never named), and sets `app.tenant_id` to `T`,
 *          transaction-locally, in every transaction that starts inside `work` (a factory's flush, a
 *          `database.transaction`), so row-level security lets the setup write and read `T`'s rows on Postgres.
 * Boundary: `./testing` only; `runAsTenant` registers it on the connected database's event manager, so a server never
 *           loads it. It checks only while the running call is `runAsTenant`'s own tenant: outside `runAsTenant`, in
 *           a platform call (`runAsTenant(undefined)`), or inside a nested `withTenant`/`asTenant` of another tenant
 *           it passes every row. A `tenantId` equal to `T` passes. A row of another tenant B is arranged in
 *           `runAsTenant(B, …)`. Native statements fire no entity event and are not checked. The setting is set only
 *           in a transaction that starts inside `work`: a read outside any transaction, or a transaction that was
 *           already running when `runAsTenant` began, keeps the session's own setting (a read then sees no tenant
 *           row). It sets no scope setting and no role, and it proves nothing about isolation: that is `asTenant`.
 * Runtime: node
 * Governing contract: ADR 0269 (testing entries); ADR 0096 (decision 4: traits run as ORM subscribers); ADR 0239.
 */
import { traitsOf } from "@stackra/model";

import { ACTIVE_TENANT } from "#node/constants/active-tenant.constant";
import { TENANT_ID_SETTING } from "#node/constants/tenant-id-setting.constant";
import { RUN_AS_TENANT_CALL } from "#testing/constants/run-as-tenant-call.constant";

/** The part of the ORM's transaction event the setting needs. */
interface TransactionStarted {
  readonly em: {
    readonly getConnection: () => {
      readonly execute: (
        sql: string,
        params: readonly unknown[],
        method: "run",
        transaction: unknown,
      ) => Promise<unknown>;
    };
  };
  readonly transaction?: unknown;
}

/** The tenant of the running `runAsTenant` call, when the call is its own (not a nested call of another tenant). */
function ownTenant(): string | undefined {
  const tenantId = RUN_AS_TENANT_CALL.getStore();
  return tenantId !== undefined && ACTIVE_TENANT.getStore() === tenantId ? tenantId : undefined;
}

/**
 * Checks new tenant-owned rows inside `runAsTenant` at flush, and sets the tenant in each transaction it starts.
 *
 * @example
 * Database.current().em().getEventManager().registerSubscriber(new RunAsTenantSubscriber());
 */
export class RunAsTenantSubscriber {
  /**
   * The ORM's `beforeCreate`.
   *
   * @throws Error when a `BelongsToTenant` row created in `runAsTenant(T)` has a `tenantId` other than `T`.
   */
  beforeCreate({
    entity,
    meta,
  }: {
    readonly entity: object;
    readonly meta: { readonly class: object; readonly className: string };
  }): void {
    const tenantId = ownTenant();
    // outside runAsTenant, a platform call, or a nested call of another tenant: not this helper's to check
    if (tenantId === undefined) return;
    if (!traitsOf(meta.class).some((trait) => trait.name === "belongs_to_tenant")) return;
    const actual = (entity as { readonly tenantId?: unknown }).tenantId;
    if (actual === tenantId) return;
    throw new Error(
      `${meta.className} was created in runAsTenant(${tenantId}) with tenantId ${String(actual)}: ` +
        "does its factory definition() set tenantId? Leave it to runAsTenant.",
    );
  }

  /**
   * The ORM's `afterTransactionStart`: sets `app.tenant_id` to the `runAsTenant` tenant for the rest of the
   * transaction (`set_config(..., true)`), as `withTenant` does, so the setup's rows pass the tenant policy.
   */
  async afterTransactionStart({ em, transaction }: TransactionStarted): Promise<void> {
    const tenantId = ownTenant();
    if (tenantId === undefined || transaction === undefined) return;
    // raw-sql: the transaction-local tenant setting row-level security reads, the value bound
    await em
      .getConnection()
      .execute("select set_config(?, ?, true)", [TENANT_ID_SETTING, tenantId], "run", transaction);
  }
}
