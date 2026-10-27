# @stackra/shipping

<!-- Stackra file contract: Purpose: the guide to @stackra/shipping (entries, carriers, pickup points, return labels,
routing, tracking, labels, weight, testing). Boundary: documentation only. Runtime: none. Governing contract: ADR 0369;
R3-SO-09. -->

The carrier contract of the shipping engine: the ports a carrier connector implements (rate quote, label with
cancel, pickup with cancel, tracking, pickup point and locker search, return label with cancel), the `CarrierGateways` port that picks a carrier per scope and Market through the
Connection ([ADR 0356](../../../apps/docs/src/docs/adr/0356-choosing-a-provider-per-tenant-and-market-through-the-connection-with-a-market-default.mdx)),
one tracking-state model with the function that normalises a carrier's events into it, checked PDF and ZPL label
documents, dimensional and chargeable weight, and the `DistanceMatrix` and `RouteSolver` routing ports with memory
drivers (R3-SO-09). ADR 0369 decides it.

No carrier driver lives here: each carrier or aggregator is an OS integrations connector whose `Connection` implements
the gateway interfaces. No carrier, Market, factor, increment or rate is in code: they are connector data, market-pack
data and rule sets ([ADR 0363](../../../apps/docs/src/docs/adr/0363-configuration-over-code-business-behaviour-is-data-rules-workflows-and-studios.mdx)).

**Tier:** `tier:lib` (`packages/commerce/shipping`). Depends on `@stackra/contracts`, `@stackra/errors` and
`@stackra/money`; isomorphic, with no clock, locale, environment or network read.

## Entry points

| Import                        | Holds                                                     | Exports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@stackra/shipping/contracts` | `src/contracts/`: the leaf                                | `CarrierCapability`, `TrackingState`, `LabelFormat`, `PickupPointKind`, `CarrierGateways`, `DistanceMatrix`, `RouteSolver`; types `CarrierGateway`, `RateGateway`, `LabelGateway`, `PickupGateway`, `TrackingGateway`, `PickupPointGateway`, `ReturnLabelGateway`, `CapabilityGateways`, `Parcel`, `ShippingAddress`, `ShippingParty`, `CustomsItem`, `RateRequest`, `RateQuote`, `LabelRequest`, `ReturnLabelRequest`, `LabelDocument`, `Shipment`, `PickupRequest`, `Pickup`, `PickupPointSearch`, `PickupPoint`, `CarrierEvent`, `TrackingMap`, `TrackingEvent`, `TrackingTimeline`, `GeoPoint`, `TimeWindow`, `TravelMatrixRequest`, `TravelMatrix`, `RouteStop`, `RouteVehicle`, `RouteProblem`, `RoutePlan` |
| `@stackra/shipping`           | `src/core/`: isomorphic functions, errors, memory drivers | `hasCapability`, `normaliseTracking`, `labelDocument`, `batchZpl`, `dimensionalWeight`, `chargeableWeight`, `NoCarrierError`, `LabelDocumentInvalidError`, `MemoryDistanceMatrixDriver`, `MemoryRouteSolverDriver`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `@stackra/shipping/testing`   | `src/testing/`: fakes (optional peer `@stackra/testing`)  | `CarrierGatewaysFake`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

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

## Pickup points and lockers

```ts
import { CarrierCapability, PickupPointKind } from "@stackra/shipping/contracts";

const gateway = await carriers.forMarket(market, [
  CarrierCapability.PickupPoints,
  CarrierCapability.Labels,
]);
const points = await gateway.searchPickupPoints({
  near: address,
  radiusM,
  limit,
  kinds: [PickupPointKind.Locker],
});
await gateway.createLabel({ ...request, pickupPointId: points[0].pointId });
```

- A carrier capability, not geography: only the carrier knows its points and which take a parcel (COM-156; ADR 0369
  open question 1). The radius and limit come from the caller's settings.
- Points come nearest first; hours are carrier text, shown as given.

## Return labels

```ts
const shipment = await gateway.createReturnLabel({
  ...request,
  shipper: customer,
  recipient: warehouse,
  outboundShipmentId,
});
```

- `CarrierCapability.Returns` is the carrier's own return product. A carrier without one is served by `createLabel`
  with the parties swapped.
- Provisional: `ReturnLabelRequest` is finalised when the Commerce returns spec lands (ADR 0369 open question 3).

## Routing

```ts
import { DistanceMatrix, RouteSolver } from "@stackra/shipping/contracts";

const { durationsS } = await distances.matrix({ origins: [store], destinations: drops, profile });
const plan = await solver.solve({ vehicles, stops }); // plan.unassigned lists what no vehicle could take
```

- `DistanceMatrix` answers whole seconds and metres, `null` when unreachable; the live delivery promise reads it.
- `RouteSolver` places stops on vehicles within windows, shifts and capacity per compartment code (codes are settings
  data), and never drops a stop.
- Drivers: `MemoryDistanceMatrixDriver` (answers the legs a test puts in) and `MemoryRouteSolverDriver` (first fit in
  stop order, no travel time) here; the OS `routing` service per region (OSRM plus VROOM) and commercial drivers named
  in `region-map.providers` live in OS geography.

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

## Testing

```ts
import { CarrierGatewaysFake } from "@stackra/shipping/testing";

const carriers = new CarrierGatewaysFake();
carriers.offers.push({ market: "zz", gateway: connection });
carriers.calls("forMarket"); // every { market, needs }
```

- Picks per Market by capability in offer order and refuses with `NoCarrierError` where a driver would.

## Not here

- Carrier and aggregator drivers, the `CarrierGateways` driver and the Connection store: OS integrations.
- The OSRM, VROOM and commercial routing drivers and geocoding: OS geography.
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
