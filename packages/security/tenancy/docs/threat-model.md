# Threat model: @stackra/tenancy

<!--
Stackra file contract:
Purpose: the threat model of @stackra/tenancy: tenant isolation in Postgres (`belongsToTenant`, `withTenant`, call
         isolation), the tenant level of the scope tree, tenant data keys, tenant tokens, sandbox tenants and
         cross-tenant shares.
Boundary: documentation only; the code wins on any difference. A change that adds an asset, a trust boundary or an
          external call updates this file in the same pull request (constitution SEC10).
Runtime: none
Governing contract: constitution SEC10 and the tenancy law; ADR 0239; ADR 0280; ADR 0343; ADR 0415; ADR 0495; ADR 0209
                    (amendment of 2026-11-07); ADR 0207 (amendment of 2026-11-26: the ASVS level); STA-316.
-->

ASVS level: L2 for V4 (access control); L1 for every other chapter (ADR 0207, amendment of 2026-11-26).
Reviewed: 2026-11-26 (STA-316).

Tenancy keeps every tenant's rows apart in two layers: Postgres row-level security that even the table owner cannot
bypass, and an application layer that sets the tenant only from the verified caller. Its threats are cross-tenant
reads and writes, and a tenant chosen by anything other than the credential.

## Assets

| Asset                 | Where it lives                                                         | Class          |
| --------------------- | ---------------------------------------------------------------------- | -------------- |
| Tenant-owned rows     | every table made with `t.belongsToTenant()`                            | `confidential` |
| Tenant data keys      | `tenant_data_keys`, wrapped by KMS and bound by the encryption context | `secret`       |
| Tenant tokens         | the holder; only their SHA-256 is stored                               | `secret`       |
| Memberships and roles | the session's claims (`TenantMembership`)                              | `pii`          |
| Billing contacts      | `TenantBillingContact`, read to send, never logged                     | `pii`          |

## Trust boundaries

1. The verified actor and scope to `CallIsolationDriver` and `withTenant`.
2. This package to Postgres: transaction-local `app.tenant_id` and the tenant policy.
3. This package to KMS for data keys.
4. A tenant to another tenant through a share, a sandbox link or a cross-region transfer.

## Threats and controls

| Threat                                                           | Control today                                                                                                                                                  | Open work                                                       |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| A query that forgets its tenant reads every tenant               | `ENABLE` and `FORCE ROW LEVEL SECURITY` with an equality policy; an unset or empty setting matches no row                                                      | —                                                               |
| The tenant comes from a body, query or client header             | `withTenant` takes only the verified actor's scope; a scope of another tenant is `tenant_scope_mismatch`, one the tree does not show `tenant_scope_unresolved` | —                                                               |
| An agent or service acts in a tenant its user does not belong to | An agent or service runs in its user's tenant; one whose own tenant differs is refused (ADR 0209, amendment of 2026-11-07)                                     | —                                                               |
| The tenant setting leaks to the next transaction                 | Every `app.*` setting is transaction-local; validate refuses a session-level one                                                                               | —                                                               |
| Background work runs with no tenant or the wrong one             | Queue, outbox, inbox and workflow units run through `CallIsolation` as their stored actor; a unit with no actor is a platform call that sees no tenant row     | Proven against real Postgres, STA-1717                          |
| A new table is created without tenant isolation                  | `t.belongsToTenant()` is the only way to write the policy; hand-written RLS is not allowed                                                                     | Gen's `model_tenancy_migration_missing` made blocking, STA-2808 |
| Pool exhaustion under call isolation denies service              | None: a call under isolation holds two connections and the pool is not sized for it                                                                            | Size the pool for call isolation, STA-1716                      |
| A wrapped data key is copied to another tenant                   | KMS binds each data key to its tenant by the encryption context, so it does not unwrap elsewhere                                                               | —                                                               |
| A stolen tenant token is replayed                                | Only the token's SHA-256 is stored; the token is never logged                                                                                                  | —                                                               |
| A share or sandbox copies more than agreed                       | Shares copy items into the receiver's own tables by terms; cross-region items need `TransferCheck`; a sandbox promotes configuration, never keys               | —                                                               |
