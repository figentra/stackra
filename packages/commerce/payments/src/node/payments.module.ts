/**
 * Stackra file contract:
 * Purpose: `PaymentsModule`, the root module of @stackra/payments: what it shares with a host's modules. The file
 *          exists because `exports` is the one thing gen cannot derive; the drivers (`connection` and `market-pack`
 *          for the gateways and the Market's providers, `market-pack` for the restricted tender programs, `memory`
 *          drivers for tests) are discovered from their files and bound by gen, and the ports the host must bind
 *          (`PaymentRecords`' and `PaymentBalances`' durable drivers, the latter over `Locks`, `PaymentPackSource`, `ConnectedAccountLimits`, `TenderEligibility` over
 *          the rules engine, `AgentCommerceProtocols` over the protocol connectors, the connection store) fail the
 *          host's build when missing. The SoftPos ports (`SoftPos`, `StripeTerminalBridge`) are bound on the device by
 *          the staff app, never here.
 * Boundary: the key is the package key (`payments`). No bindings list and no imports: gen infers edges from
 *           constructor types (ADR 0263).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 12, 15 and 16); ADR 0305 (an optional root module, written for its exports);
 *                     ADR 0263 (gen writes the wiring); ADR 0445; ADR 0446; STA-1024.
 */
import { Module } from "@stackra/container";

import { PaymentBalanceService } from "#core/services/payment-balance.service";
import { PaymentService } from "#core/services/payment.service";
import { RestrictedTenderService } from "#core/services/restricted-tender.service";

/**
 * A host takes it by listing the package as a dependency; gen derives the host's module imports from it.
 *
 * @example
 * // services/payments/package.json
 * { "dependencies": { "@stackra/payments": "workspace:*" } }
 */
export class PaymentsModule extends Module({
  exports: [PaymentService, RestrictedTenderService, PaymentBalanceService],
}) {}
