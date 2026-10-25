/**
 * Stackra file contract:
 * Purpose: `PaymentGatewaysFake`, a `PaymentGateways` over a fixed list of gateways for tests: any Market gets the
 *          first gateway with every capability needed, and a stored connection gets the gateway with that provider
 *          and id.
 * Boundary: test support from `./testing`; bind it with `.override(PaymentGateways, PaymentGatewaysFake.with([...]))`.
 *           The real Market resolution is `ConnectionPaymentGatewaysDriver`'s, tested on its own.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (fakes in ./testing); ADR 0356 (decision 2).
 */
import type { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import { PaymentGateways } from "#contracts/ports/payment-gateways.port";
import type { PaymentGateway } from "#contracts/types/payment-gateway.type";
import { NoPaymentProviderError } from "#core/errors/no-payment-provider.error";

/**
 * Gateways from a list.
 *
 * @example
 * const gateways = PaymentGatewaysFake.with([PaymentGatewayFake.with()]);
 */
export class PaymentGatewaysFake extends PaymentGateways {
  /** The gateways, in preference order. */
  private readonly gateways: readonly PaymentGateway[];

  private constructor(gateways: readonly PaymentGateway[]) {
    super();
    this.gateways = gateways;
  }

  /** A fake over `gateways`. */
  static with(gateways: readonly PaymentGateway[]): PaymentGatewaysFake {
    return new PaymentGatewaysFake(gateways);
  }

  async forMarket(market: string, needs: readonly PaymentCapability[]): Promise<PaymentGateway> {
    const found = this.gateways.find((gateway) =>
      needs.every((need) => gateway.capabilities.includes(need)),
    );
    if (found === undefined)
      throw NoPaymentProviderError.create({ market, needs: needs.join(",") });
    return found;
  }

  async byConnection(provider: string, connectionId: string): Promise<PaymentGateway> {
    const found = this.gateways.find(
      (gateway) => gateway.provider === provider && gateway.id === connectionId,
    );
    if (found === undefined) throw NoPaymentProviderError.create({ provider });
    return found;
  }
}
