/**
 * Stackra file contract:
 * Purpose: the contract of the `./contracts` entry: exactly the enums and the ports at runtime, and the shape of every
 *          type it exports (required and optional fields, read-only fields, the gateway interfaces a connector's
 *          Connection implements, pickup points, return labels and the routing request and result types).
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias and the runner through
 *           @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15); ADR 0369; R3-SO-09.
 */
import { Enum } from "@stackra/contracts";
import { Money } from "@stackra/money";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as entry from "#contracts/index";
import type {
  CapabilityGateways,
  CarrierCapability as CarrierCapabilityCode,
  CarrierEvent,
  CarrierGateway,
  CustomsItem,
  LabelDocument,
  LabelGateway,
  LabelRequest,
  Parcel,
  Pickup,
  PickupGateway,
  PickupPoint,
  PickupPointGateway,
  PickupPointSearch,
  PickupRequest,
  RateGateway,
  RateQuote,
  RateRequest,
  ReturnLabelGateway,
  ReturnLabelRequest,
  RoutePlan,
  RouteProblem,
  Shipment,
  ShippingAddress,
  ShippingParty,
  TrackingEvent,
  TrackingGateway,
  TrackingMap,
  TrackingTimeline,
  TravelMatrix,
  TravelMatrixRequest,
} from "#contracts/index";

const { CarrierCapability, LabelFormat, PickupPointKind, TrackingState } = entry;

const address: ShippingAddress = { lines: ["Line 1"], city: "City", country: "ZZ" };
const party: ShippingParty = { name: "Name", address };
const parcel: Parcel = { lengthMm: 300, widthMm: 200, heightMm: 100, weightG: 1_000 };
const label: LabelDocument = { format: LabelFormat.Zpl, bytes: new TextEncoder().encode("^XA^XZ") };

describe("@stackra/shipping/contracts", () => {
  it("exports exactly the runtime surface", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "CarrierCapability",
      "CarrierGateways",
      "DistanceMatrix",
      "LabelFormat",
      "PickupPointKind",
      "RouteSolver",
      "TrackingState",
    ]);
  });

  it("takes minimal and full addresses, parties and parcels", () => {
    const pinned: ShippingAddress = {
      ...address,
      region: "Region",
      postalCode: "00000",
      coordinates: { latitude: 1.5, longitude: 2.5 },
    };
    const business: ShippingParty = {
      ...party,
      company: "Co",
      phone: "+10000000000",
      email: "a@b.test",
    };
    expect([pinned.coordinates?.latitude, business.address, parcel.weightG]).toEqual([
      1.5,
      address,
      1_000,
    ]);
    // @ts-expect-error -- an address has a country
    const countryless: ShippingAddress = { lines: [], city: "City" };
    // @ts-expect-error -- a parcel has a weight
    const weightless: Parcel = { lengthMm: 1, widthMm: 1, heightMm: 1 };
    expect([countryless.city, weightless.lengthMm]).toEqual(["City", 1]);
  });

  it("carries money on requests, quotes, shipments and customs lines", () => {
    const value = Money.of("10.00", "USD");
    const item: CustomsItem = {
      description: "Goods",
      hsCode: "620520",
      originCountry: "ZZ",
      quantity: 1,
      value,
      weightG: 500,
    };
    const rate: RateRequest = {
      origin: address,
      destination: address,
      parcels: [parcel],
      cashOnDelivery: value,
    };
    const quote: RateQuote = {
      service: "std",
      name: "Standard",
      amount: value,
      transitDays: { min: 1, max: 3 },
    };
    const request: LabelRequest = {
      reference: "ful_1",
      service: quote.service,
      shipper: party,
      recipient: party,
      parcels: rate.parcels,
      format: LabelFormat.Pdf,
      customs: [item],
    };
    const shipment: Shipment = {
      shipmentId: "s1",
      trackingNumbers: ["t1"],
      service: request.service,
      labels: [label],
      charge: value,
    };
    expect([shipment.labels.length, request.customs?.[0]?.hsCode]).toEqual([1, "620520"]);
    // @ts-expect-error -- a label request names its format
    const formatless: LabelRequest = { ...request, format: undefined };
    expect(formatless.reference).toBe("ful_1");
  });

  it("books pickups and maps tracking", () => {
    const pickupRequest: PickupRequest = {
      reference: "run_1",
      location: party,
      from: "2026-10-25T09:00:00+03:00",
      to: "2026-10-25T17:00:00+03:00",
      shipmentIds: ["s1"],
    };
    const pickup: Pickup = { pickupId: "p1", from: pickupRequest.from, to: pickupRequest.to };
    const raw: CarrierEvent = { code: "OFD", at: "2026-10-25T08:00:00Z", location: "Hub" };
    const map: TrackingMap = { OFD: TrackingState.OutForDelivery };
    const event: TrackingEvent = { ...raw, state: TrackingState.OutForDelivery };
    const timeline: TrackingTimeline = { state: event.state, events: [event], unmapped: [] };
    expect([pickup.pickupId, map.OFD, timeline.state]).toEqual([
      "p1",
      "out_for_delivery",
      "out_for_delivery",
    ]);
    // @ts-expect-error -- a map holds normalised states only
    const loose: TrackingMap = { OFD: "out" };
    expect(loose.OFD).toBe("out");
  });

  it("keeps every field read-only", () => {
    const copy: Parcel = { ...parcel };
    // @ts-expect-error -- parcels are not edited in place
    copy.weightG = 2;
    expect(copy.weightG).toBe(2);
  });

  it("maps each capability code to its gateway interface", () => {
    expectTypeOf<CapabilityGateways["rates"]>().toEqualTypeOf<RateGateway>();
    expectTypeOf<CapabilityGateways["labels"]>().toEqualTypeOf<LabelGateway>();
    expectTypeOf<CapabilityGateways["pickups"]>().toEqualTypeOf<PickupGateway>();
    expectTypeOf<CapabilityGateways["tracking"]>().toEqualTypeOf<TrackingGateway>();
    expectTypeOf<CapabilityGateways["pickup_points"]>().toEqualTypeOf<PickupPointGateway>();
    expectTypeOf<CapabilityGateways["returns"]>().toEqualTypeOf<ReturnLabelGateway>();
    expectTypeOf<keyof CapabilityGateways>().toEqualTypeOf<CarrierCapabilityCode>();
  });

  it("lets one connection implement every gateway", async () => {
    const connection: CarrierGateway &
      RateGateway &
      LabelGateway &
      PickupGateway &
      TrackingGateway = {
      id: "con_1",
      provider: "carrier_a",
      capabilities: Enum.values(CarrierCapability),
      trackingMap: {},
      quote: async () => [],
      createLabel: async (request) => ({
        shipmentId: request.reference,
        trackingNumbers: [],
        service: request.service,
        labels: [label],
      }),
      cancel: async () => undefined,
      schedulePickup: async (request) => ({
        pickupId: request.reference,
        from: request.from,
        to: request.to,
      }),
      cancelPickup: async () => undefined,
      track: async () => [],
    };
    expect(
      await connection.quote({ origin: address, destination: address, parcels: [parcel] }),
    ).toEqual([]);
    expect(await connection.track("s1")).toEqual([]);
  });

  it("searches pickup points and buys return labels", async () => {
    const search: PickupPointSearch = {
      near: address,
      radiusM: 2_000,
      limit: 5,
      kinds: [PickupPointKind.Locker],
      parcels: [parcel],
    };
    const point: PickupPoint = {
      pointId: "pt_1",
      kind: PickupPointKind.Locker,
      name: "Locker",
      address,
      distanceM: 350,
      hours: ["24/7"],
    };
    const connection: CarrierGateway & PickupPointGateway & ReturnLabelGateway = {
      id: "con_1",
      provider: "carrier_a",
      capabilities: [CarrierCapability.PickupPoints, CarrierCapability.Returns],
      searchPickupPoints: async () => [point],
      createReturnLabel: async (request) => ({
        shipmentId: request.reference,
        trackingNumbers: [],
        service: request.service,
        labels: [label],
      }),
      cancelReturnLabel: async () => undefined,
    };
    const request: ReturnLabelRequest = {
      reference: "ret_1",
      service: "return",
      shipper: party,
      recipient: party,
      parcels: [parcel],
      format: LabelFormat.Pdf,
      pickupPointId: point.pointId,
      outboundShipmentId: "s1",
    };
    expect((await connection.searchPickupPoints(search))[0]?.pointId).toBe("pt_1");
    expect((await connection.createReturnLabel(request)).shipmentId).toBe("ret_1");
    // @ts-expect-error -- a point has a kind
    const kindless: PickupPoint = { pointId: "pt_2", name: "Shop", address };
    expect(kindless.name).toBe("Shop");
  });

  it("shapes travel matrices and route problems and plans", () => {
    const at = { latitude: 1, longitude: 2 };
    const request: TravelMatrixRequest = {
      origins: [at],
      destinations: [at, at],
      profile: "van",
      departAt: "2026-10-25T09:00:00Z",
    };
    const matrix: TravelMatrix = { durationsS: [[0, null]], distancesM: [[0, null]] };
    const problem: RouteProblem = {
      vehicles: [
        {
          vehicleId: "v1",
          start: at,
          end: at,
          shift: { from: "2026-10-25T08:00:00Z", to: "2026-10-25T16:00:00Z" },
          capacity: { chilled: 10 },
        },
      ],
      stops: [{ stopId: "o1", location: at, demand: { chilled: 2 }, serviceS: 120 }],
      profile: request.profile,
    };
    const plan: RoutePlan = {
      routes: [
        {
          vehicleId: "v1",
          visits: [
            { stopId: "o1", arriveAt: "2026-10-25T08:00:00Z", departAt: "2026-10-25T08:02:00Z" },
          ],
          distanceM: 0,
          durationS: 120,
        },
      ],
      unassigned: [],
    };
    expect([matrix.durationsS[0]?.[1], problem.stops.length, plan.routes[0]?.durationS]).toEqual([
      null,
      1,
      120,
    ]);
    // @ts-expect-error -- a vehicle has a shift
    const shiftless: RouteProblem["vehicles"][number] = {
      vehicleId: "v2",
      start: at,
      capacity: {},
    };
    expect(shiftless.vehicleId).toBe("v2");
  });
});
