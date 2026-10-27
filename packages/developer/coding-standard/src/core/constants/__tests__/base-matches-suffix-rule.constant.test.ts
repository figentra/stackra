/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/base-matches-suffix`: kind bases, aliases, partner type arguments, override
 *          aliases, same-kind classes and local schema bases pass; a `@stackra/contracts` driver may extend its
 *          local port and a testing-entry `.service.ts` harness may have no base, and nowhere else; a wrong or
 *          missing base is reported; files with no class kind are ignored.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { BASE_MATCHES_SUFFIX_RULE } from "#core/constants/base-matches-suffix-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
});
const ACTION_FILE = "src/modules/orders/actions/cancel-order.action.ts";
const CONTRACTS_DRIVER =
  "/repo/packages/foundation/contracts/src/core/drivers/noop-tracer.driver.ts";
const PORT_DRIVER =
  'import { Tracer } from "#core/ports/tracer.port";\n\nexport class NoopTracerDriver extends Tracer {}';

tester.run(
  "base-matches-suffix",
  BASE_MATCHES_SUFFIX_RULE as unknown as Parameters<RuleTester["run"]>[1],
  {
    valid: [
      {
        filename: ACTION_FILE,
        code: 'export class CancelOrderAction extends Action({ key: "order.cancel" }) {}',
      },
      {
        filename: "src/modules/orders/models/order.model.ts",
        code: "export class Order extends Model.with(HasPublicId, Timestamps) {}",
      },
      {
        filename: "src/modules/orders/access/order.policy.ts",
        code: "export class OrderPolicy extends Policy<Order> {}",
      },
      {
        filename: "src/modules/orders/resources/order/order.resource.ts",
        code: "export class OrderResource extends Resource<Order>({ area: 1 }) {}",
      },
      {
        filename: "src/modules/orders/events/order-paid.event.ts",
        code: 'export class OrderPaid extends IntegrationEvent({ name: "order.paid" }) {}',
      },
      {
        filename: "src/modules/orders/services/order.service.ts",
        code: "export class OrderService extends CrudService<Order> {}",
      },
      {
        filename: "src/config/analytics.config.ts",
        code: "export class AnalyticsConfig extends BaseAnalyticsConfig {}",
      },
      {
        filename: "src/config/env.config.ts",
        code: "export class MobileEnvConfig extends Config {}",
      },
      {
        filename: "src/core/errors/unresolved-port.error.ts",
        code: "export class UnresolvedPortError extends Error {}",
      },
      {
        filename: "src/modules/orders/schemas/order-view.schema.ts",
        code: 'import { OrderSummary } from "./order-summary.schema";\n\nexport class OrderView extends OrderSummary {}',
      },
      {
        filename: "src/modules/home/resources/order/orders.widget.ts",
        code: 'export class OrdersWidget extends Widget.place(BaseOrdersWidget, { slot: "home" }) {}',
      },
      {
        filename: "src/core/functions/sum.function.ts",
        code: "export class Accumulator {}",
      },
      {
        filename: "src/modules/orders/actions/__tests__/cancel-order.action.test.ts",
        code: "class FakeOrders {}",
      },
      { filename: CONTRACTS_DRIVER, code: PORT_DRIVER },
      {
        filename: "/repo/packages/foundation/container/src/testing/services/testing-app.service.ts",
        code: "export class TestingApp {}",
      },
    ],
    invalid: [
      {
        filename: ACTION_FILE,
        code: 'export class CancelOrderAction extends Query({ key: "order.cancel" }) {}',
        errors: [
          {
            messageId: "wrongBase",
            data: {
              name: "CancelOrderAction",
              kind: "action",
              expected: "`Action`",
              actual: "Query",
            },
          },
        ],
      },
      {
        filename: ACTION_FILE,
        code: "export class CancelOrderAction {}",
        errors: [
          {
            messageId: "missingBase",
            data: { name: "CancelOrderAction", kind: "action", expected: "`Action`" },
          },
        ],
      },
      {
        filename: "src/modules/orders/events/order-paid.event.ts",
        code: "export class OrderPaid extends Event {}",
        errors: [{ messageId: "wrongBase" }],
      },
      {
        filename: "src/modules/orders/schemas/order-view.schema.ts",
        code: 'import { Shape } from "@acme/shapes";\n\nexport class OrderView extends Shape {}',
        errors: [{ messageId: "wrongBase" }],
      },
      {
        // outside @stackra/contracts a driver calls `Driver(port)`
        filename:
          "/repo/packages/foundation/calendar/src/core/drivers/computed-prayer-times.driver.ts",
        code: PORT_DRIVER,
        errors: [{ messageId: "wrongBase" }],
      },
      {
        // in @stackra/contracts the port is still a local import, not a package's class
        filename: CONTRACTS_DRIVER,
        code: 'import { Tracer } from "@acme/tracing";\n\nexport class NoopTracerDriver extends Tracer {}',
        errors: [{ messageId: "wrongBase" }],
      },
      {
        // a testing harness has no base or the service base, never another kind's
        filename: "/repo/packages/foundation/container/src/testing/services/testing-app.service.ts",
        code: "export class TestingApp extends Query {}",
        errors: [{ messageId: "wrongBase" }],
      },
      {
        filename: "/repo/packages/runtime/app/src/core/services/app-wiring.service.ts",
        code: "export class AppWiring {}",
        errors: [{ messageId: "missingBase" }],
      },
    ],
  },
);
