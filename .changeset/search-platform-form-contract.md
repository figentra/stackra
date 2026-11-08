---
"@stackra/search": minor
---

The tenancy contract step of `search.vector_items` and `search.queries`, in the platform form. Migration
`search.0009_contract_search_tenancy` keeps `tenant_id` nullable: a NULL row is the platform's (the global corpus).
A tenant session reads its own rows and the platform's rows, and writes only its own. It cannot update, delete or take
over a platform row. A platform session reads and writes only NULL rows. The scope path still narrows a tenant's rows.
A tenant reads the platform rows at the root and at its own product's node, never another product's.

The migration first refuses, before changing anything, while a row has no tenant but sits at or below a tenant node
(deeper than a product node). Such a row belongs to a tenant and was written in the expand step outside a tenant call.
An environment with such rows runs the tenant backfill (RUNWAY 4c) first. A NULL row at the root or at a product node
is a platform row and stays.
