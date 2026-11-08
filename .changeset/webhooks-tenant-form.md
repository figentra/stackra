---
"@stackra/webhooks": minor
"@stackra/database": patch
---

Webhook endpoints and their delivery log now belong to a tenant (ADR 0239 amendment, group (c)).

Migration `webhooks.0003` gives `webhook_endpoints` and `webhook_deliveries` a `tenant_id` column. It is required,
filled from the running tenant call by default, and indexed. Each table gets one row-level-security policy: a call sees
and writes only its own tenant's rows. Before, neither table had a policy; the endpoint service filtered by scope.

Existing rows get their tenant in the same migration. An endpoint registered at a top-level tenant node takes that
node, and each delivery takes its endpoint's tenant. If any row is left without a tenant (an endpoint at the root, at a
product, or below a tenant), the migration refuses before changing anything and names each table's count. Delete or
re-register those endpoints, then migrate again.

`WebhookEndpoint` and `WebhookDelivery` carry `BelongsToTenant`. Every read and write of these tables must now run in a
tenant call; the pipeline, the delivery job and the inbox already do. The package ships an int test tier (`test:int`).

`CrudService` writes that use `requiresNew` (`insert`, `insertMany`, `upsert`, `update`) now carry the caller's scope
and tenant into their own transaction, as `Database.transaction` with `requiresNew` already did. Before, such a write
ran on a new connection with no tenant, so row security refused it on a tenant-owned table.
