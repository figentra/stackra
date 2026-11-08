---
"@stackra/search": minor
---

The tenancy contract step of `search.vector_items` and `search.queries`, in the platform form. Migration
`search.0009_contract_search_tenancy` keeps `tenant_id` nullable: a NULL row is the platform's (the global corpus).
A tenant session reads its own rows and the platform's rows, and writes only its own. It cannot update, delete or take
over a platform row. A platform session reads and writes only NULL rows. The scope path still narrows a tenant's rows,
and every tenant reads the platform rows.

The migration first refuses, before changing anything, while a row has no tenant but sits below the platform root.
Such a row belongs to a tenant and was written in the expand step outside a tenant call. An environment with such rows
runs the tenant backfill (RUNWAY 4c) first. A NULL row at the root is a platform row and stays.
