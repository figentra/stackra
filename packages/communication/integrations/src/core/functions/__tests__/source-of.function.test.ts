/**
 * Stackra file contract:
 * Purpose: unit tests of `sourceOf`: it keeps the source and resource a caller gives, leaves both out when none is
 *          given, and refuses a resource id on a connection that is not managed.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; R3-SO-03.
 */
import { describe, expect, it } from "@stackra/testing";

import { ProviderSource } from "#contracts/enums/provider-source.enum";
import type { Connection } from "#core/bases/connection.base";
import { sourceOf } from "#core/functions/source-of.function";
import type { ConnectInput } from "#core/types/connect-input.type";

/** A connect input with no fields. */
const input = (extra: Partial<ConnectInput<Connection>>): ConnectInput<Connection> => ({
  fields: {},
  ...extra,
});

describe("sourceOf", () => {
  it("keeps what the caller gives and leaves out what it does not", () => {
    expect(sourceOf(input({}))).toEqual({});
    expect(sourceOf(input({ source: ProviderSource.Byo }))).toEqual({ source: "byo" });
    expect(sourceOf(input({ source: ProviderSource.Managed, resourceId: "res_1" }))).toEqual({
      source: "managed",
      resourceId: "res_1",
    });
  });

  it("refuses a resource on a connection that is not managed", () => {
    expect(() => sourceOf(input({ resourceId: "res_1" }))).toThrow(TypeError);
    expect(() => sourceOf(input({ source: ProviderSource.Byo, resourceId: "res_1" }))).toThrow(
      /managed/,
    );
  });
});
