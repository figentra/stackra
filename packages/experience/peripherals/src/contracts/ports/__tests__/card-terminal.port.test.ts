/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `CardTerminal` port: keyed `peripherals.CardTerminal`, its memory driver an
 *          instance of it, pairing and status answering the paired terminal.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0339 (decision 1); ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CardTerminal } from "#contracts/ports/card-terminal.port";
import type { PairedTerminal } from "#contracts/types/paired-terminal.type";
import { MemoryCardTerminalDriver } from "#core/drivers/memory-card-terminal.driver";

describe("CardTerminal", () => {
  it("is a port its drivers are instances of", () => {
    const terminal = new MemoryCardTerminalDriver();
    expect(terminal).toBeInstanceOf(CardTerminal);
    expect(terminal).toBeInstanceOf(Port);
  });

  it("is keyed peripherals.CardTerminal and types its calls", () => {
    expectTypeOf<CardTerminal["~key"]>().toEqualTypeOf<"peripherals.CardTerminal">();
    expectTypeOf<CardTerminal["status"]>().returns.toEqualTypeOf<
      Promise<CapabilityResult<PairedTerminal>>
    >();
  });
});
