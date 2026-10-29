/**
 * Stackra file contract:
 * Purpose: proves `StripeTerminalCardTerminalDriver` pairs a Stripe Bluetooth reader by serial at the server's
 *          location, reports ready, busy and offline, unpairs, and refuses with `unavailable` on `card_terminal` or
 *          `permission_denied` on `bluetooth` exactly where ADR 0479 decision 2 says, asking `DevicePermissions` for
 *          Bluetooth then location before discovery.
 * Boundary: test only; replays the recorded SDK answers through the stand-in `StackraCardTerminal` module.
 * Runtime: node (vitest)
 * Governing contract: ADR 0479 (decisions 2 and 4); ADR 0339 (decision 1); ADR 0022 (test placement).
 */
import { MemoryDevicePermissionsDriver } from "@stackra/platform";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { StripeTerminalCardTerminalDriver } from "#native/drivers/stripe-terminal-card-terminal.driver";
import { CARD_TERMINAL_SDK } from "#native/__tests__/card-terminal-sdk.fixture";
import { StandInServer } from "#native/__tests__/stand-in-server.fixture";

const M2 = CARD_TERMINAL_SDK.reader.iosM2;
const PAIRING = { terminalId: M2.serialNumber, provider: "stripe", address: null };
const UNAVAILABLE = { ok: false, error: { code: "unavailable", capability: "card_terminal" } };
const DENIED = { ok: false, error: { code: "permission_denied", capability: "bluetooth" } };

describe("StripeTerminalCardTerminalDriver", () => {
  afterEach(CARD_TERMINAL_SDK.uninstall);

  it("refuses without the module", async () => {
    const terminal = new StripeTerminalCardTerminalDriver(
      new StandInServer(),
      new MemoryDevicePermissionsDriver(),
    );
    expect(await terminal.pair(PAIRING)).toEqual(UNAVAILABLE);
    expect(await terminal.status()).toEqual(UNAVAILABLE);
  });

  it("refuses another provider or a LAN address before touching the SDK", async () => {
    const module = CARD_TERMINAL_SDK.install();
    const terminal = new StripeTerminalCardTerminalDriver(
      new StandInServer(),
      new MemoryDevicePermissionsDriver(),
    );
    expect(await terminal.pair({ ...PAIRING, provider: "geidea" })).toEqual(UNAVAILABLE);
    expect(await terminal.pair({ ...PAIRING, address: "tcp://10.0.0.30:6000" })).toEqual(
      UNAVAILABLE,
    );
    expect(module.initialize).not.toHaveBeenCalled();
  });

  it("pairs the reader of that serial at the server's location and reports ready", async () => {
    const module = CARD_TERMINAL_SDK.install();
    const terminal = new StripeTerminalCardTerminalDriver(
      new StandInServer(),
      new MemoryDevicePermissionsDriver(),
    );
    expect(await terminal.pair(PAIRING)).toEqual({
      ok: true,
      data: { terminalId: M2.serialNumber, provider: "stripe", state: "ready" },
    });
    expect(module.initialize).toHaveBeenCalledTimes(1);
    expect(module.discoverBluetoothReaders).toHaveBeenCalledWith(30_000, M2.serialNumber);
    expect(module.connectBluetoothReader).toHaveBeenCalledWith(M2.serialNumber, "tml_stand_in");
  });

  it("reports busy while the reader takes a payment, on either platform's spelling", async () => {
    const module = CARD_TERMINAL_SDK.install();
    const terminal = new StripeTerminalCardTerminalDriver(
      new StandInServer(),
      new MemoryDevicePermissionsDriver(),
    );
    await terminal.pair(PAIRING);
    module.paymentStatus.mockResolvedValueOnce("waitingForInput");
    expect(await terminal.status()).toMatchObject({ ok: true, data: { state: "busy" } });
    module.paymentStatus.mockResolvedValueOnce("PROCESSING");
    expect(await terminal.status()).toMatchObject({ ok: true, data: { state: "busy" } });
  });

  it("reports offline once the reader dropped or another reader is connected", async () => {
    const module = CARD_TERMINAL_SDK.install();
    const terminal = new StripeTerminalCardTerminalDriver(
      new StandInServer(),
      new MemoryDevicePermissionsDriver(),
    );
    await terminal.pair(PAIRING);
    module.setConnected(null);
    expect(await terminal.status()).toMatchObject({ ok: true, data: { state: "offline" } });
    module.setConnected(CARD_TERMINAL_SDK.reader.iosTapToPay);
    expect(await terminal.status()).toMatchObject({ ok: true, data: { state: "offline" } });
  });

  it("refuses a serial no discovery found", async () => {
    CARD_TERMINAL_SDK.install();
    const terminal = new StripeTerminalCardTerminalDriver(
      new StandInServer(),
      new MemoryDevicePermissionsDriver(),
    );
    expect(await terminal.pair({ ...PAIRING, terminalId: "STRM00000000000" })).toEqual(UNAVAILABLE);
  });

  it("refuses when the site has no Stripe location", async () => {
    const module = CARD_TERMINAL_SDK.install();
    const server = new StandInServer();
    server.location = null;
    const terminal = new StripeTerminalCardTerminalDriver(
      server,
      new MemoryDevicePermissionsDriver(),
    );
    expect(await terminal.pair(PAIRING)).toEqual(UNAVAILABLE);
    expect(module.discoverBluetoothReaders).not.toHaveBeenCalled();
  });

  it("asks DevicePermissions for Bluetooth then location before discovery", async () => {
    const module = CARD_TERMINAL_SDK.install();
    const permissions = new MemoryDevicePermissionsDriver();
    expect(
      await new StripeTerminalCardTerminalDriver(new StandInServer(), permissions).pair(PAIRING),
    ).toMatchObject({ ok: true });
    expect(permissions.statuses).toMatchObject({ bluetooth: "granted", location: "granted" });
    expect(module.discoverBluetoothReaders).toHaveBeenCalledTimes(1);
  });

  it("refuses with permission_denied when Bluetooth or location is denied or blocked", async () => {
    for (const [granted, status] of [
      ["location", "denied"],
      ["location", "blocked"],
      ["bluetooth", "denied"],
      ["bluetooth", "blocked"],
    ] as const) {
      const module = CARD_TERMINAL_SDK.install();
      const permissions = new MemoryDevicePermissionsDriver();
      permissions.statuses[granted] = "granted";
      permissions.requestAnswer = status;
      expect(
        await new StripeTerminalCardTerminalDriver(new StandInServer(), permissions).pair(PAIRING),
      ).toEqual(DENIED);
      expect(module.discoverBluetoothReaders).not.toHaveBeenCalled();
    }
  });

  it("maps the SDK's permission errors to permission_denied and others to unavailable", async () => {
    for (const error of [
      CARD_TERMINAL_SDK.error.iosBluetoothDenied,
      CARD_TERMINAL_SDK.error.androidBluetoothDenied,
      CARD_TERMINAL_SDK.error.androidLocationOff,
    ]) {
      CARD_TERMINAL_SDK.install({ discoverBluetoothReaders: async () => ({ error }) });
      expect(
        await new StripeTerminalCardTerminalDriver(
          new StandInServer(),
          new MemoryDevicePermissionsDriver(),
        ).pair(PAIRING),
      ).toEqual(DENIED);
    }
    CARD_TERMINAL_SDK.install({
      connectBluetoothReader: async () => ({ error: CARD_TERMINAL_SDK.error.iosConnectFailed }),
    });
    expect(
      await new StripeTerminalCardTerminalDriver(
        new StandInServer(),
        new MemoryDevicePermissionsDriver(),
      ).pair(PAIRING),
    ).toEqual(UNAVAILABLE);
  });

  it("refuses when the SDK will not start", async () => {
    CARD_TERMINAL_SDK.install({
      initialize: async () => {
        throw new Error("SDK failed to start");
      },
    });
    expect(
      await new StripeTerminalCardTerminalDriver(
        new StandInServer(),
        new MemoryDevicePermissionsDriver(),
      ).pair(PAIRING),
    ).toEqual(UNAVAILABLE);
  });

  it("disconnects and forgets on unpair, and on a new pairing", async () => {
    const module = CARD_TERMINAL_SDK.install();
    const terminal = new StripeTerminalCardTerminalDriver(
      new StandInServer(),
      new MemoryDevicePermissionsDriver(),
    );
    expect(await terminal.unpair()).toEqual({ ok: true, data: undefined });
    expect(module.disconnectReader).not.toHaveBeenCalled();
    await terminal.pair(PAIRING);
    await terminal.pair({
      ...PAIRING,
      terminalId: CARD_TERMINAL_SDK.reader.androidWisePad.serialNumber,
    });
    expect(module.disconnectReader).toHaveBeenCalledTimes(1);
    expect(await terminal.unpair()).toEqual({ ok: true, data: undefined });
    expect(module.disconnectReader).toHaveBeenCalledTimes(2);
    expect(await terminal.status()).toEqual(UNAVAILABLE);
  });
});
