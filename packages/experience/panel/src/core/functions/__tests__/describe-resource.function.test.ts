/**
 * Stackra file contract:
 * Purpose: unit tests of `describeResource`: a class that is not a resource is refused, and no constructor runs while the
 *          members are recorded.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 5 and 7).
 */
import { ApiArea } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Resource } from "#core/bases/resource.base";
import { describeResource } from "#core/functions/describe-resource.function";
import type { Table } from "#core/types/table.type";

interface Row {
  readonly id: string;
}

describe("describeResource", () => {
  it("refuses a class that is not a resource", () => {
    expect(() => describeResource(class {})).toThrow(TypeError);
  });

  it("records the members without constructing the class", () => {
    let constructed = 0;
    class Rows extends Resource<Row>({ area: ApiArea.Admin, operations: { list: true } }) {
      constructor() {
        super();
        constructed += 1;
      }

      override table(t: Table<Row>) {
        return t.columns((c) => [c.from("id")]);
      }
    }
    expect(describeResource(Rows).table?.columns).toEqual([{ kind: "value", key: "id" }]);
    expect(constructed).toBe(0);
  });
});
