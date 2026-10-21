---
name: frontend-resource-console
description: Build console screens as declarations - @Resource with form and infolist schemas from model fields, tables with columns, filters, sorts and bulk actions bound to @Action, relation panels, navigation, @Page and @Widget - rendered by @stackra/panel on @stackra/ui, with L2 tenant overrides and custom pages as the escape hatch. Use for any admin, operator, tenant-admin or customer-portal screen.
---

# Console resources

Console screens are **declared by modules and rendered generically** (ADR 0164). A module declares `@Resource`,
`@Page` and `@Widget`; gen and the registry publish them; `@stackra/panel`, built on `@stackra/ui`, draws them on web and
native. Coded screens are the exception. Panels: platform admin, product operator, tenant admin, customer portal.
Shapes follow the ADRs; `@stackra/panel` docs win once it ships.

## Decide first

| Need                                              | Use                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| List, view, create, edit a model                  | `@Resource` on the model, actions bound to its table and form        |
| A dashboard tile, a stat, a chart                 | `@Widget`, data from a `@Query`                                     |
| A screen that is not a model                      | `@Page` composed of registered components                            |
| A tenant wants a different layout                 | An L2 override document (ADR 0110): data that only references code  |
| Nothing above fits                                | A custom page in the app (escape hatch), reviewed by design and a11y |

## Worked example

Resource declarations live in the module's `resources/` kind folder (ADR 0126 decision 3).

```ts
// src/modules/invoices/resources/invoice.resource.ts
import { Resource, Table, Column, Filter, Form, Field, Infolist, Entry } from "@stackra/panel";
import { Invoice } from "#modules/invoices/models/invoice.model";
import { RefundInvoiceAction } from "#modules/invoices/actions/refund-invoice.action";

@Resource({
  model: Invoice,
  key: "billing.invoices",
  label: "billing::resources.invoices",
  navigation: { group: "billing::nav.finance", icon: "receipt", order: 10 },
  panels: ["tenant-admin", "product-operator"],
})
export class InvoiceResource {
  table = Table.of(Invoice, {
    columns: [
      Column.text("number").sortable().searchable(),
      Column.money("totalMinor", { currencyField: "currency" }).sortable(),
      Column.badge("status"),
      Column.dateTime("issuedAt").sortable(),
    ],
    filters: [Filter.select("status"), Filter.dateRange("issuedAt")],
    defaultSort: { issuedAt: "desc" },
    rowActions: [RefundInvoiceAction],     // bound by reference; gen fails if the action does not exist
    bulkActions: [],
  });

  form = Form.of(Invoice, { fields: [Field.from("customerId"), Field.from("dueAt"), Field.repeater("lines")] });
  infolist = Infolist.of(Invoice, { entries: [Entry.from("number"), Entry.from("status"), Entry.relation("payments")] });
}
```

Field types, validation and labels come from the model's field decorators (ADR 0095), so the form needs no duplicated
rules. A row action shows the confirmation, modal form, notifications and after-effects the action declares
(ADR 0139); visibility and the disabled state come from IAM and entitlements, with an upgrade prompt when the
entitlement is missing.

## Web rules

- Vite and React Router 7 with code-based routes; no other React framework and no file-based routing (ADR 0165).
- HeroUI v3 through `@stackra/ui`; form adapters live in `@stackra/ui`, never in the app. HeroUI Pro only in our own apps;
  free packages never depend on Pro components (ADR 0165, 0197).
- Strings are `<module>::key` i18n keys; logical properties; tokens only; light and dark (ADR 0080, 0231).
- Budgets: entry 200 KB gzipped, route chunk 100 KB, LCP 2.5 s, INP 200 ms, CLS 0.1 (ADR 0183).

## Never

- A hand-coded list or edit screen for a model that a resource covers.
- Business logic in a component; a button calls an action.
- Code, markup or expressions in tenant override data (ADR 0110).

## Check

`pnpm --filter @figentra/console test typecheck build`, then `pnpm verify`. Review: `design-brand-reviewer`,
`accessibility-reviewer`, `performance-reviewer`.
