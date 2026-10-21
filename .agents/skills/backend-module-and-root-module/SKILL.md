---
name: backend-module-and-root-module
description: Structure Stackra code as modules - the @Module with its key and name, the root module declared in package.json for gen, src/modules/<feature>/ kind folders, imports and exports, forRoot and forFeature registration, provider scopes, lifecycle hooks and createTestingModule. Use when creating a service, a package's root module, a feature module, or wiring providers.
---

# Modules and the root module

The module is the unit of contribution (ADR 0111): a feature module declares its actions, queries, listeners, settings,
permissions, resources and assets, and a service or app only hosts modules. `stackra gen` discovers everything through
each member's **root module** (ADR 0090). Shapes follow the ADRs; `@stackra/container` docs win once it ships.

## Layout (ADR 0126, 0130)

```text
services/billing/                       # or packages/<category>/<name>/
├── package.json                        # "stackra": { "module": "./src/billing.module.ts" }
├── config/billing.config.ts            # deploy-time config (ADR 0146)
└── src/
    ├── main.ts                         # bootstraps the root module
    ├── billing.module.ts               # root @Module: imports feature modules, nothing else
    ├── contracts/index.ts              # types-only ./contracts entry (ADR 0117)
    ├── __tests__/billing.module.test.ts
    └── modules/
        └── invoices/
            ├── invoices.module.ts
            ├── assets/{public,lang,templates,stubs,data}/   # ADR 0234, created with the first file
            ├── models/      actions/    queries/   services/
            ├── events/      listeners/  workflows/ policies/
            ├── permissions/ settings/   contracts/ resources/
            └── __tests__/
```

Kind folders appear with their first file; `resources/` holds `@Resource` panel declarations (ADR 0126 decision 3;
ADR 0130's list omits it, and the ADR steward reconciles the two). `interfaces/`, `types/`, `constants/`, `tokens/`, `errors/` and `decorators/`
appear once there are two files of that kind (ADR 0128). There are **no** `controllers/`, `dtos/`, `repositories/`,
`presentation/`, `helpers/` or `utils/` folders. `raw/` holds only raw `@Controller` endpoints. Dependencies point
inward: actions, listeners and workflows use services and models; models import from no other folder.

## Worked example

```ts
// src/modules/invoices/invoices.module.ts
import { Module } from "@stackra/container";
import { RefundInvoiceAction } from "#modules/invoices/actions/refund-invoice.action";
import { ListInvoicesQuery } from "#modules/invoices/queries/list-invoices.query";
import { InvoiceService } from "#modules/invoices/services/invoice.service";
import { INVOICE_PERMISSIONS } from "#modules/invoices/permissions/invoice.permissions";

@Module({
  key: "billing",              // required, dotted, unique across the manifest; prefixes action, permission,
  name: "billing",             // event and setting keys (ADR 0131); `name` is the asset/i18n namespace (ADR 0234)
  providers: [InvoiceService, RefundInvoiceAction, ListInvoicesQuery],
  permissions: INVOICE_PERMISSIONS,
  exports: [InvoiceService],
})
export class InvoicesModule {}

// src/billing.module.ts — the root module only hosts
@Module({ key: "billing.service", imports: [InvoicesModule, DatabaseModule.forFeature([Invoice])] })
export class BillingModule {}
```

```json
// package.json
{ "name": "@figentra/service-billing", "stackra": { "module": "./src/billing.module.ts" } }
```

The module version is the package's semver; there is no second version (ADR 0131). `@Deprecated({ since, replacement,
sunset })` marks a deprecated action, event, field, setting or trait.

## Registration (ADR 0143)

- `Module.forRoot(options)` / `forRootAsync({ useFactory, inject })` once per app; `forFeature(...)` per consuming
  module; `register(...)` for a one-off. Named instances: `forRoot({ default, instances })`.
- Scopes: `singleton` (default), `request` (per request, job or workflow step, via `AsyncLocalStorage`; carries tenant,
  actor, locale, trace), `transient`. A singleton never injects a request-scoped provider; it injects the context
  accessor. Checked at boot.
- Lifecycle: `onModuleInit`, `onApplicationBootstrap`, `beforeApplicationShutdown`, `onModuleDestroy`,
  `onApplicationShutdown`. Explorers run at bootstrap; readiness only after it.
- A circular dependency is a boot error; there is no `forwardRef`.
- Tokens are `defineToken<T>()` values or classes, never strings (skill `backend-define-family`).

## Testing

```ts
const module = await createTestingModule({ imports: [InvoicesModule] })
  .overrideProvider(PAYMENT_GATEWAY).useValue(fakeGateway)
  .compile();
const action = module.get(RefundInvoiceAction);
```

## Never

- Contributions declared in a service or app file outside a module (gen fails, ADR 0111).
- `app()`, `config()`, `logger()` global helpers; inject instead (ADR 0145).
- A global metadata polyfill or type-based auto-wiring (ADR 0005).
- `../` imports; use the member's `#` aliases (ADR 0233).

## Check

`pnpm validate` (service shape, `stackra.module` exists), `pnpm --filter <member> test`, `pnpm verify`.
