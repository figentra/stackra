---
name: backend-define-family
description: Create the values decorators refer to with the define family - defineToken, defineConfig with secret references, definePermissions, defineEvents, defineMeters, defineEntitlements, defineSkill and definePrompts - and inject stateful things instead of using app(), config() or logger() helpers. Use when adding a DI token, package config, a permission catalogue, event, meter or entitlement definitions, or an AI skill or prompt.
---

# The define family

**Decorators annotate code; `define*` creates values** (ADR 0247, ADR 0145). A token, a config schema, a permission list
or a skill is a value other code references, so it is built by a `define*` call at module scope, never by a decorator.
The registry collects both kinds, so gen and the Explorers see one catalogue. Shapes follow the ADRs; package docs win
once they ship.

| Function             | Creates                                                     | ADR        |
| -------------------- | ----------------------------------------------------------- | ---------- |
| `defineToken<T>()`   | A typed, namespaced `Symbol.for` DI token; every interface port has one, under the interface's name | 0145, 0263 |
| `defineConfig<S>()`  | A package or host config with Zod schema and secret refs    | 0146       |
| `definePermissions`  | The one permission catalogue value a module declares        | 0132       |
| `defineEvents`       | Integration event names and payload schemas                 | 0141       |
| `defineMeters`       | Usage meters                                                | 0216       |
| `defineEntitlements` | Entitlement keys and their limits                           | 0215       |
| `defineSkill`        | An AI skill: instructions, tools, examples, knowledge       | 0245       |
| `definePrompts`      | Versioned MCP prompts with evaluations                      | 0245       |

## Worked examples

```ts
// contracts/invoice-storage.ts — every interface port has a same-named token (ADR 0263); `<module>.<TypeName>` key (ADR 0231)
export interface InvoiceStorage { put(key: string, body: Uint8Array): Promise<void>; }
export const InvoiceStorage = defineToken<InvoiceStorage>("billing.InvoiceStorage");

// config/billing.config.ts — defineConfig returns a value with a same-named type (ADR 0263)
export const BillingConfig = defineConfig("billing", BillingSchema, defaults);
export type BillingConfig = z.infer<typeof BillingSchema>;
```

A constructor typed `storage: InvoiceStorage` or `config: BillingConfig` needs no `@Inject`, for one driver or many. A local class is its own token, and gen wires it from its constructor types (ADR 0263).

```ts
// config/billing.config.ts — deploy-time, never per tenant (ADR 0146)
export default defineConfig({
  schema: z.object({
    provider: z.enum(["stripe", "manual"]),
    timeoutMs: z.number().int().default(5000),
    apiKey: z.custom<SecretRef>(),
  }),
  defaults: { provider: "manual", apiKey: secret("STRIPE_SECRET_KEY") },
});
```

Layers merge in this order: package defaults, the host file, the env file, `STACKRA_<PKG>__<PATH>` env vars, then
`runway.yaml` overrides. Secrets and arrays replace, objects deep-merge; the result is validated and frozen. `secret()`
holds a **name**, SCREAMING_SNAKE `<PROVIDER>_<PURPOSE>` (ADR 0231 decision 4); gen turns it into an Encore `secret()` declaration, and a human or the secret-manager flow sets the
value (ADR 0257). Runtime, per-tenant values are **settings**, not config (ADR 0108, 0213).

```ts
// permissions/invoice.permissions.ts — `<module>.<resource>.<action>` (ADR 0132, 0231)
export const INVOICE_PERMISSIONS = definePermissions("billing", {
  "invoice.read": { label: "billing::permissions.invoice_read" },
  "invoice.refund": { label: "billing::permissions.invoice_refund", risk: "L3" },
});
```

```ts
// events/invoice.events.ts — `<module-key>.<aggregate>.<verb>.v<n>` (ADR 0141)
export const INVOICE_EVENTS = defineEvents("billing", {
  "invoice.paid.v1": z.object({ invoiceId: z.string(), amountMinor: z.number().int() }),
  "invoice.refunded.v1": z.object({ invoiceId: z.string(), refundId: z.string() }),
});
```

## Injection, not helpers

`app()`, `config()` and `logger()` are banned everywhere (ADR 0145). Inject the config, the logger and the clock:

```ts
constructor(
  private readonly config: BillingConfig,
  private readonly storage: InvoiceStorage,
  private readonly logger: Logger,
  private readonly clock: Clock,
) {}
```

Every one of them is injected by its type: a same-named token or a class, so none takes `@Inject`. `@Inject` is only for a
named instance (ADR 0263, ADR 0143).

Pure utilities (`Str`, `Arr`, `Num`, `DateTime`) are plain imported functions, with no injection.

## Never

- String tokens; a `define*` inside a class body; a decorator that builds a value.
- An `@Inject` on an interface port, on config or on a local class, or a token whose name differs from its type (ADR 0263).
- A secret value anywhere in config, tests or fixtures.
- Tenant-dependent config (a lint flags it); use settings.

## Check

`pnpm --filter <member> test typecheck`, then `pnpm verify`.
