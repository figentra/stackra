/**
 * Stackra file contract:
 * Purpose: unit tests of `@AccessLogged`: a class facet made with `createDecorator`, kind `access_logged`, that records
 *          its options on actions, queries and services (and their subclasses) and refuses any other class.
 * Boundary: test only; no container, the decorator's own reader.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 6); ADR 0144 as amended by 0294.
 */
import { DecoratorTarget, Service } from "@stackra/container";
import { DataClassification } from "@stackra/contracts";
import { Schema } from "@stackra/validation";
import { describe, expect, it } from "@stackra/testing";

import { AccessLogged } from "#core/decorators/access-logged.decorator";

const OPTIONS = {
  classification: DataClassification.Pseudonymous,
  subjects: "customerId",
} as const;

@AccessLogged(OPTIONS)
class OrderReads extends Service {}

class ArchivedOrderReads extends OrderReads {}

class PlainReads extends Service {}

describe("AccessLogged", () => {
  it("is the access_logged class facet of actions, queries and services", () => {
    expect(AccessLogged.kind).toBe("access_logged");
    expect(AccessLogged.target).toBe(DecoratorTarget.Class);
    expect(AccessLogged.kinds).toEqual(["action", "query", "service"]);
  });

  it("records its options on the class and its subclasses", () => {
    expect(AccessLogged.on(OrderReads)).toEqual(OPTIONS);
    expect(AccessLogged.on(ArchivedOrderReads)).toEqual(OPTIONS);
    expect(AccessLogged.on(PlainReads)).toBeUndefined();
  });

  it("refuses a class of another kind", () => {
    expect(() => {
      @AccessLogged(OPTIONS)
      class OrderView extends Schema {}
      return OrderView;
    }).toThrow(TypeError);
  });
});
