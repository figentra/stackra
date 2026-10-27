/**
 * Stackra file contract:
 * Purpose: `CarrierGatewaysFake`, a `CarrierGateways` that answers from the offers a test puts in `offers`: per Market,
 *          the first gateway with every needed capability, all of them in order, or the gateway of a connection.
 * Boundary: built on `Fake` of @stackra/testing; records the first argument of every call, as `FakeRecorder` takes
 *           it. It refuses with `NoCarrierError` exactly where the port says a driver does, so the engine's refusal
 *           paths are testable. The gateways are the test's own literals; no carrier is named here.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3: fakes in the owner's `./testing`); ADR 0369 (decision 3); ADR 0356.
 */
import { Fake } from "@stackra/testing";

import type { CarrierCapability } from "#contracts/enums/carrier-capability.enum";
import { CarrierGateways } from "#contracts/ports/carrier-gateways.port";
import type { CarrierGateway } from "#contracts/types/carrier-gateway.type";
import { NoCarrierError } from "#core/errors/no-carrier.error";

/**
 * Carriers per Market, in memory.
 *
 * @example
 * const carriers = new CarrierGatewaysFake();
 * carriers.offers.push({ market: "zz", gateway: connection });
 * container.override(CarrierGateways, carriers);
 */
export class CarrierGatewaysFake extends Fake.of(CarrierGateways) {
  /** What each Market offers, preferred first. */
  readonly offers: { readonly market: string; readonly gateway: CarrierGateway }[] = [];

  /** Records `market`, then the first offer of `market` with every capability in `needs`. */
  async forMarket(market: string, needs: readonly CarrierCapability[]): Promise<CarrierGateway> {
    this.record("forMarket", market);
    const [gateway] = this.matching(market, needs);
    if (gateway === undefined) throw NoCarrierError.create({ market, needs: needs.join(",") });
    return gateway;
  }

  /** Records `market`, then every offer of `market` with every capability in `needs`, in order. */
  async allForMarket(
    market: string,
    needs: readonly CarrierCapability[],
  ): Promise<readonly CarrierGateway[]> {
    this.record("allForMarket", market);
    return this.matching(market, needs);
  }

  /** Records `provider`, then the offered gateway with this provider and connection id. */
  async byConnection(provider: string, connectionId: string): Promise<CarrierGateway> {
    this.record("byConnection", provider);
    const offer = this.offers.find(
      ({ gateway }) => gateway.provider === provider && gateway.id === connectionId,
    );
    if (offer === undefined) throw NoCarrierError.create({ provider });
    return offer.gateway;
  }

  /** The gateways of `market` that list every capability in `needs`. */
  private matching(market: string, needs: readonly CarrierCapability[]): CarrierGateway[] {
    return this.offers
      .filter((offer) => offer.market === market)
      .map((offer) => offer.gateway)
      .filter((gateway) => needs.every((need) => gateway.capabilities.includes(need)));
  }
}
