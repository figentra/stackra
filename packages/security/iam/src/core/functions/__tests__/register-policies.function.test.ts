/**
 * Stackra file contract:
 * Purpose: unit tests of `registerPolicies`: a row pairs a model with its policy and its fact source, and a model that
 *          is not a class, a policy that is not a policy and rules that are not a `Rules` registry fail at boot.
 * Boundary: test only; the registry is cleared before each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0132 (as amended by 0294 and 0263); ADR 0331 (decision 4).
 */
import type { AnyClass } from "@stackra/container";
import { type FactField, FieldType } from "@stackra/rules/contracts";
import { Rules } from "@stackra/rules";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { Policy } from "#core/bases/policy.base";
import { POLICY_REGISTRY } from "#core/constants/policy-registry.constant";
import { registerPolicies } from "#core/functions/register-policies.function";
import type { PolicyRegistration } from "#core/types/policy-registration.type";

class Order {}

class OrderPolicy extends Policy<Order> {}

const ORDER_FACTS = Rules.create({
  key: "orders.order",
  sources: [
    {
      key: "record",
      fields: {
        region: { type: FieldType.String, label: "orders::fields.region" as FactField["label"] },
      },
    },
  ],
});

describe("registerPolicies", () => {
  beforeEach(() => POLICY_REGISTRY.rows.clear());

  it("pairs a model with its policy and fact source", () => {
    registerPolicies([{ model: Order, policy: OrderPolicy, rules: ORDER_FACTS }]);
    expect(POLICY_REGISTRY.rows.get(Order)).toEqual({
      model: Order,
      policy: OrderPolicy,
      rules: ORDER_FACTS,
    });
  });

  it("refuses a model that is not a class, a policy that is not a policy and rules that are not Rules", () => {
    const notPolicy = class {} as unknown as AnyClass<Policy<object>>;
    expect(() =>
      registerPolicies([{ model: "order", policy: OrderPolicy } as unknown as PolicyRegistration]),
    ).toThrow(/model class/);
    expect(() => registerPolicies([{ model: Order, policy: notPolicy }])).toThrow(
      /does not extend Policy/,
    );
    expect(() =>
      registerPolicies([
        { model: Order, policy: OrderPolicy, rules: {} } as unknown as PolicyRegistration,
      ]),
    ).toThrow(/Rules.create/);
  });
});
