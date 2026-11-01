/**
 * Stackra file contract:
 * Purpose: unit tests of `TerminalConnectionRequiredError`: a validation refusal with its code, retryability, Market
 *          and serving Connections.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; STA-1718.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { TerminalConnectionRequiredError } from "#core/errors/terminal-connection-required.error";

describe("TerminalConnectionRequiredError", () => {
  it("is a validation refusal carrying the Market and the serving Connections", () => {
    const refusal = TerminalConnectionRequiredError.create({
      market: "m1",
      connections: "conn_a,conn_b",
    });
    expect(isRefusal(refusal, TerminalConnectionRequiredError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.Validation);
    expect(refusal.code).toBe("terminal_connection_required");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ market: "m1", connections: "conn_a,conn_b" });
  });
});
