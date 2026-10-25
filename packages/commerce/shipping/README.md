# @stackra/shipping

The carrier contract of the shipping engine: the ports a carrier connector implements (rate quote, label with
cancel, pickup with cancel, tracking), the `CarrierGateways` port that picks a carrier per tenant and Market through the
Connection ([ADR 0356](../../../apps/docs/src/adr/0356-choosing-a-provider-per-tenant-and-market-through-the-connection-with-a-market-default.mdx)),
one tracking-state model with the function that normalises a carrier's events into it, checked PDF and ZPL label
documents, and dimensional and chargeable weight. ADR 0369 decides it.

No carrier driver lives here: each carrier or aggregator is an OS integrations connector whose `Connection` implements
the gateway interfaces. No carrier, Market, factor, increment or rate is in code: they are connector data, market-pack
data and rule sets ([ADR 0363](../../../apps/docs/src/adr/0363-configuration-over-code-business-behaviour-is-data-rules-workflows-and-studios.mdx)).

**Tier:** `tier:lib` (`packages/commerce/shipping`). Depends on `@stackra/contracts`, `@stackra/errors` and
`@stackra/money`; isomorphic, with no clock, locale, environment or network read.

## Entry points

| Import                        | Holds                                     | Exports                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@stackra/shipping/contracts` | `src/contracts/`: the leaf                | `CarrierCapability`, `TrackingState`, `LabelFormat`, `CarrierGateways`; types `CarrierGateway`, `RateGateway`, `LabelGateway`, `PickupGateway`, `TrackingGateway`, `CapabilityGateways`, `Parcel`, `ShippingAddress`, `ShippingParty`, `CustomsItem`, `RateRequest`, `RateQuote`, `LabelRequest`, `LabelDocument`, `Shipment`, `PickupRequest`, `Pickup`, `CarrierEvent`, `TrackingMap`, `TrackingEvent`, `TrackingTimeline` |
| `@stackra/shipping`           | `src/core/`: isomorphic functions, errors | `hasCapability`, `normaliseTracking`, `labelDocument`, `batchZpl`, `dimensionalWeight`, `chargeableWeight`, `NoCarrierError`, `LabelDocumentInvalidError`                                                                                                                                                                                                                                                                    |

Entry barrels are generated, never authored (ADR 0294 decision 15); until `stackra gen` writes them (STA-339), each
`index.ts` is a stand-in barrel.

## Carriers

```ts
import { hasCapability } from "@stackra/shipping";
import { CarrierCapability, CarrierGateways } from "@stackra/shipping/contracts";

const gateway = await carriers.forMarket(market, [CarrierCapability.Labels]);
if (hasCapability(gateway, CarrierCapability.Labels)) {
  const shipment = await gateway.createLabel(request); // a repeated request.reference returns the same shipment
}
```

- `forMarket` returns one gateway with every needed capability; `allForMarket` returns all of them, preferred first,
  for live quotes at checkout; `byConnection` returns the connection that bought a label.
- A connector declares its `capabilities`; `hasCapability` narrows by them and never calls the carrier.

## Tracking

```ts
import { normaliseTracking } from "@stackra/shipping";

const timeline = normaliseTracking(await gateway.track(shipmentId), gateway.trackingMap);
timeline.state; // "out_for_delivery"
timeline.unmapped; // carrier codes the connector's map lacks
```

- The map is connector data. A code missing from it is listed in `unmapped`, never guessed.
- The latest instant wins, so a late webhook for an older event never moves the state back. The same code at the same
  instant counts once.

## Labels

```ts
import { batchZpl, labelDocument } from "@stackra/shipping";
import { LabelFormat } from "@stackra/shipping/contracts";

const label = labelDocument(LabelFormat.Zpl, response.labelBase64); // refuses a non-ZPL or open document
const job = batchZpl(labels); // one print job for a thermal printer
```

- `labelDocument` checks the envelope (`%PDF-`; `^XA` … `^XZ`) and refuses with `LabelDocumentInvalidError`.
- ZPL batches join by concatenation. PDF merging is a `@stackra/documents` operation.

## Weight

```ts
import { chargeableWeight } from "@stackra/shipping";

chargeableWeight(parcel, card.factor, card.incrementG); // grams
```

- Parcels are in millimetres and grams; the factor is cubic centimetres per kilogram, so `grams = mm³ / factor`.
- The factor and the billing increment come from the carrier's connector or rate card.

## Not here

- Carrier and aggregator drivers, the `CarrierGateways` driver and the Connection store: OS integrations.
- Shipping zones, table and flat rates, free shipping, restrictions, delivery promise, slots, box suggestion and the
  failed-delivery flow: the Commerce shipping module, with rule sets and workflow templates.
- Printing: `@stackra/peripherals` (`LabelPrinter`); storing documents and merging PDFs: `@stackra/documents`.

## Tasks

| Task            | Command                                         |
| --------------- | ----------------------------------------------- |
| `build`         | `tsdown`                                        |
| `typecheck`     | `tsc --noEmit`                                  |
| `lint`          | `oxlint .`                                      |
| `test`          | `vitest run`                                    |
| `test:coverage` | `vitest run --coverage` (shared gate: 80/80/70) |
| `format`        | `oxfmt --write .`                               |
| `format:check`  | `oxfmt --check .`                               |
| `clean`         | `rm -rf dist coverage .turbo`                   |

Run one with `pnpm turbo run <task> --filter=@stackra/shipping`.
