/**
 * Stackra file contract:
 * Purpose: `PAYMENT_CONNECTIONS`, the connection class of every payments provider this package drives, by provider
 *          code: how a provider code from market-pack data or a stored payment becomes a driver.
 * Boundary: mechanism only: it lists drivers, never which Market uses which (that is `MarketPaymentDefaults`' data).
 *           Each key equals its Integration's `provider` and its connection's `provider` getter (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); ADR 0357 (decision 2); ADR 0358 (decision 3).
 */
import type { Connection, ConnectionClass } from "@stackra/integrations";

import type { PaymentGateway } from "#contracts/types/payment-gateway.type";
import { CheckoutConnection } from "#core/providers/checkout/checkout.connection";
import { CheckoutSandboxConnection } from "#core/providers/checkout/checkout-sandbox.connection";
import { FawryConnection } from "#core/providers/fawry/fawry.connection";
import { FawrySandboxConnection } from "#core/providers/fawry/fawry-sandbox.connection";
import { HyperpayConnection } from "#core/providers/hyperpay/hyperpay.connection";
import { HyperpaySandboxConnection } from "#core/providers/hyperpay/hyperpay-sandbox.connection";
import { MoyasarConnection } from "#core/providers/moyasar/moyasar.connection";
import { PaymobConnection } from "#core/providers/paymob/paymob.connection";
import { StripeConnection } from "#core/providers/stripe/stripe.connection";
import { TabbyConnection } from "#core/providers/tabby/tabby.connection";
import { TamaraConnection } from "#core/providers/tamara/tamara.connection";
import { TamaraSandboxConnection } from "#core/providers/tamara/tamara-sandbox.connection";

/** Provider code to connection class. */
export const PAYMENT_CONNECTIONS: Readonly<
  Record<string, ConnectionClass<Connection & PaymentGateway>>
> = {
  checkout: CheckoutConnection,
  "checkout-sandbox": CheckoutSandboxConnection,
  fawry: FawryConnection,
  "fawry-sandbox": FawrySandboxConnection,
  hyperpay: HyperpayConnection,
  "hyperpay-sandbox": HyperpaySandboxConnection,
  moyasar: MoyasarConnection,
  paymob: PaymobConnection,
  stripe: StripeConnection,
  tabby: TabbyConnection,
  tamara: TamaraConnection,
  "tamara-sandbox": TamaraSandboxConnection,
};
