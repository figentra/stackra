/**
 * Stackra file contract:
 * Purpose: proves `prepareCardTerminal` sets the token relay once, answers each SDK token request with a fresh token
 *          from the server, answers a refused one as `connection_token_failed` without the server's message, and
 *          initialises the SDK.
 * Boundary: test only; the token is a placeholder from the stand-in server.
 * Runtime: node (vitest)
 * Governing contract: ADR 0479 (decision 4); ADR 0022 (test placement).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { prepareCardTerminal } from "#native/functions/prepare-card-terminal.function";
import { CARD_TERMINAL_SDK } from "#native/__tests__/card-terminal-sdk.fixture";
import { StandInServer } from "#native/__tests__/stand-in-server.fixture";

describe("prepareCardTerminal", () => {
  afterEach(CARD_TERMINAL_SDK.uninstall);

  it("answers undefined without the module", async () => {
    expect(await prepareCardTerminal(new StandInServer())).toBeUndefined();
  });

  it("sets the relay once and initialises the SDK on every call", async () => {
    const module = CARD_TERMINAL_SDK.install();
    const server = new StandInServer();
    expect(await prepareCardTerminal(server)).toBe(module);
    expect(await prepareCardTerminal(server)).toBe(module);
    expect(module.addListener).toHaveBeenCalledTimes(1);
    expect(module.addListener).toHaveBeenCalledWith(
      "onConnectionTokenRequest",
      expect.any(Function),
    );
    expect(module.initialize).toHaveBeenCalledTimes(2);
  });

  it("answers each token request with a fresh token from the server", async () => {
    const module = CARD_TERMINAL_SDK.install();
    await prepareCardTerminal(new StandInServer());
    module.requestToken({ requestId: "r1" });
    module.requestToken({ requestId: "r2" });
    await vi.waitFor(() => expect(module.resolveConnectionToken).toHaveBeenCalledTimes(2));
    expect(module.resolveConnectionToken).toHaveBeenNthCalledWith(1, "r1", "stand_in_token_1");
    expect(module.resolveConnectionToken).toHaveBeenNthCalledWith(2, "r2", "stand_in_token_2");
  });

  it("answers a refused token as a failure, never with a stored value", async () => {
    const module = CARD_TERMINAL_SDK.install();
    const server = new StandInServer();
    await prepareCardTerminal(server);
    module.requestToken({ requestId: "r1" });
    await vi.waitFor(() => expect(module.resolveConnectionToken).toHaveBeenCalledTimes(1));
    server.isRefusingTokens = true;
    module.requestToken({ requestId: "r2" });
    await vi.waitFor(() =>
      expect(module.rejectConnectionToken).toHaveBeenCalledWith("r2", "connection_token_failed"),
    );
    expect(module.resolveConnectionToken).toHaveBeenCalledTimes(1);
  });
});
