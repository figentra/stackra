/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryCardTerminalDriver`: pairing answers the terminal and its state, status refuses with
 *          none paired, unpair forgets it, and an unreachable terminal refuses on `card_terminal`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0339 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { TerminalState } from "#contracts/enums/terminal-state.enum";
import { MemoryCardTerminalDriver } from "#core/drivers/memory-card-terminal.driver";

const PAIRING = { terminalId: "T-0042", provider: "memory", address: null };
const refused = { ok: false, error: { code: "unavailable", capability: "card_terminal" } };

describe("MemoryCardTerminalDriver", () => {
  it("pairs, reports and unpairs", async () => {
    const terminal = new MemoryCardTerminalDriver();
    expect(await terminal.status()).toEqual(refused);
    expect(await terminal.pair(PAIRING)).toEqual({
      ok: true,
      data: { terminalId: "T-0042", provider: "memory", state: TerminalState.Ready },
    });
    terminal.state = TerminalState.Busy;
    expect(await terminal.status()).toMatchObject({ ok: true, data: { state: "busy" } });
    expect(await terminal.unpair()).toEqual({ ok: true, data: undefined });
    expect(await terminal.status()).toEqual(refused);
  });

  it("refuses to pair an unreachable terminal", async () => {
    const terminal = new MemoryCardTerminalDriver();
    terminal.isReachable = false;
    expect(await terminal.pair(PAIRING)).toEqual(refused);
    expect(terminal.paired).toBeNull();
  });
});
