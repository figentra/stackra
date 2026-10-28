/**
 * Stackra file contract:
 * Purpose: unit tests of `EcrCardTerminalDriver`: pairing needs a `tcp://` address that connects, status is ready,
 *          busy or offline, an exchange frames the payload (STX, payload, ETX, LRC), resends on NAK, acknowledges a
 *          good answer frame and refuses a bad one, a signal goes beside a running exchange, and a timeout or a
 *          dropped link rejects.
 * Boundary: test only; `node:net` is mocked, so no socket is opened. The bytes are recorded fixtures of the framing,
 *           not a provider's certified messages.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0377 (decisions 1 and 2); ADR 0253 (decisions 2 to 4).
 */
import { EventEmitter } from "node:events";

import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { TerminalState } from "#contracts/enums/terminal-state.enum";
import { EcrCardTerminalDriver } from "#desktop/drivers/ecr-card-terminal.driver";

const node = vi.hoisted(() => ({ createConnection: vi.fn() }));

vi.mock("node:net", () => ({ createConnection: node.createConnection }));

const STX = 0x02;
const ETX = 0x03;
const ACK = 0x06;
const NAK = 0x15;

/** A fake socket: records what was written and lets `answer` script the terminal's reply to each write. */
type FakeSocket = EventEmitter & {
  written: number[][];
  answer: (bytes: number[], socket: FakeSocket) => void;
  setTimeout: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  write: (bytes: Uint8Array) => boolean;
};

let socket: FakeSocket;

/** The frame of `text`. */
function frameOf(text: string, check?: number): number[] {
  const body = [...new TextEncoder().encode(text), ETX];
  return [STX, ...body, check ?? body.reduce((x, byte) => x ^ byte, 0)];
}

/** Sends `bytes` from the terminal. */
function fromTerminal(bytes: number[]): void {
  queueMicrotask(() => socket.emit("data", Uint8Array.from(bytes)));
}

const pairing = { terminalId: "T-0042", provider: "geidea", address: "tcp://10.0.0.30:6000" };
const timing = { answerMs: 200, ackMs: 20, retries: 1 };

describe("EcrCardTerminalDriver", () => {
  beforeEach(() => {
    node.createConnection.mockReset();
    node.createConnection.mockImplementation(() => {
      socket = Object.assign(new EventEmitter(), {
        written: [] as number[][],
        answer: (_bytes: number[], _socket: FakeSocket) => undefined,
        setTimeout: vi.fn(),
        destroy: vi.fn(),
        write(bytes: Uint8Array) {
          socket.written.push([...bytes]);
          socket.answer([...bytes], socket);
          return true;
        },
      }) as FakeSocket;
      queueMicrotask(() => socket.emit("connect"));
      return socket;
    });
  });

  it("pairs over tcp and reports ready", async () => {
    const terminal = new EcrCardTerminalDriver();
    expect(await terminal.pair(pairing)).toEqual({
      ok: true,
      data: { terminalId: "T-0042", provider: "geidea", state: TerminalState.Ready },
    });
    expect(node.createConnection).toHaveBeenCalledWith({ host: "10.0.0.30", port: 6000 });
  });

  it("refuses a pairing without a tcp address or a connection", async () => {
    const terminal = new EcrCardTerminalDriver();
    const refused = { ok: false, error: { code: "unavailable", capability: "card_terminal" } };
    expect(await terminal.pair({ ...pairing, address: null })).toEqual(refused);
    node.createConnection.mockImplementation(() => {
      const failing = Object.assign(new EventEmitter(), { setTimeout: vi.fn(), destroy: vi.fn() });
      queueMicrotask(() => failing.emit("error", new Error("ECONNREFUSED")));
      return failing;
    });
    expect(await terminal.pair(pairing)).toEqual(refused);
    expect(await terminal.status()).toEqual(refused);
  });

  it("frames an exchange, acknowledges the answer and returns its payload", async () => {
    const terminal = new EcrCardTerminalDriver();
    await terminal.pair(pairing);
    socket.answer = (bytes) => {
      if (bytes[0] === STX) fromTerminal([ACK, ...frameOf("PUR|chk_9|00")]);
    };
    const answer = await terminal.exchange(new TextEncoder().encode("PUR|chk_9|2500"), timing);
    expect(new TextDecoder().decode(answer)).toBe("PUR|chk_9|00");
    expect(socket.written).toEqual([frameOf("PUR|chk_9|2500"), [ACK]]);
  });

  it("resends a refused frame and refuses an answer with a bad check byte", async () => {
    const terminal = new EcrCardTerminalDriver();
    await terminal.pair(pairing);
    let sends = 0;
    socket.answer = (bytes) => {
      if (bytes[0] !== STX) return;
      sends += 1;
      if (sends === 1) fromTerminal([NAK]);
      else fromTerminal([ACK, ...frameOf("bad", 0x00), ...frameOf("PUR|ok")]);
    };
    const answer = await terminal.exchange(new TextEncoder().encode("PUR"), timing);
    expect(new TextDecoder().decode(answer)).toBe("PUR|ok");
    expect(socket.written).toEqual([frameOf("PUR"), frameOf("PUR"), [NAK], [ACK]]);
  });

  it("signals beside a running exchange and reports busy meanwhile", async () => {
    const terminal = new EcrCardTerminalDriver();
    await terminal.pair(pairing);
    socket.answer = (bytes) => {
      if (bytes[0] === STX) fromTerminal([ACK]);
    };
    const running = terminal.exchange(new TextEncoder().encode("PUR"), timing);
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    expect(await terminal.status()).toMatchObject({
      ok: true,
      data: { state: TerminalState.Busy },
    });
    await terminal.signal(new TextEncoder().encode("CAN"), timing);
    fromTerminal(frameOf("PUR|17"));
    expect(new TextDecoder().decode(await running)).toBe("PUR|17");
  });

  it("rejects when nothing acknowledges, nothing answers, or the link drops", async () => {
    const terminal = new EcrCardTerminalDriver();
    await terminal.pair(pairing);
    await expect(terminal.signal(new TextEncoder().encode("CAN"), timing)).rejects.toThrow(
      "did not acknowledge",
    );
    socket.answer = (bytes) => {
      if (bytes[0] === STX) fromTerminal([ACK]);
    };
    await expect(terminal.exchange(new TextEncoder().encode("PUR"), timing)).rejects.toThrow(
      "timed out",
    );
    const dropped = terminal.exchange(new TextEncoder().encode("PUR"), timing);
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    socket.emit("close");
    await expect(dropped).rejects.toThrow("dropped");
  });

  it("forgets the terminal on unpair", async () => {
    const terminal = new EcrCardTerminalDriver();
    await terminal.pair(pairing);
    expect(await terminal.unpair()).toEqual({ ok: true, data: undefined });
    expect(socket.destroy).toHaveBeenCalled();
    expect((await terminal.status()).ok).toBe(false);
  });
});
