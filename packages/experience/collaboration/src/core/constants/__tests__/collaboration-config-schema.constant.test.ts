/**
 * Stackra file contract:
 * Purpose: unit tests of `COLLABORATION_CONFIG_SCHEMA`: the defaults, the field bounds, and no object-level refinement,
 *          so a host's generated schema can `.extend` it field by field.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { COLLABORATION_CONFIG_SCHEMA } from "#core/constants/collaboration-config-schema.constant";

describe("COLLABORATION_CONFIG_SCHEMA", () => {
  it("parses nothing into the defaults", () => {
    expect(COLLABORATION_CONFIG_SCHEMA.parse({})).toEqual({
      cursorIntervalMilliseconds: 50,
      snapshotIntervalSeconds: 30,
    });
  });

  it.each([
    ["a cursor interval under 16 ms", { cursorIntervalMilliseconds: 15 }],
    ["a cursor interval past one second", { cursorIntervalMilliseconds: 1001 }],
    ["a fractional cursor interval", { cursorIntervalMilliseconds: 20.5 }],
    ["a snapshot interval of zero", { snapshotIntervalSeconds: 0 }],
    ["a snapshot interval past one hour", { snapshotIntervalSeconds: 3601 }],
  ])("refuses %s", (_case, values) => {
    expect(COLLABORATION_CONFIG_SCHEMA.safeParse(values).success).toBe(false);
  });

  it("can be extended field by field, as gen extends it for a host", () => {
    const Host$ = COLLABORATION_CONFIG_SCHEMA.extend({
      snapshotIntervalSeconds: COLLABORATION_CONFIG_SCHEMA.shape.snapshotIntervalSeconds
        .unwrap()
        .default(10),
    });
    expect(Host$.parse({})).toEqual({
      cursorIntervalMilliseconds: 50,
      snapshotIntervalSeconds: 10,
    });
    expect(Host$.safeParse({ snapshotIntervalSeconds: 0 }).success).toBe(false);
  });
});
