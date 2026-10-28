/**
 * Stackra file contract:
 * Purpose: `EcrCardTerminalDriver`, the `CardTerminal` driver of a semi-integrated terminal on the shop's network
 *          (`peripherals.cardTerminal: "ecr"`): it pairs to `tcp://<host>:<port>`, reports ready, busy or offline, and
 *          is the local link the payments ECR driver speaks through. `exchange` sends one framed message and resolves
 *          with the terminal's answer; `signal` sends one (a cancel) beside a running exchange. Frames are
 *          STX, payload, ETX, LRC (the XOR of payload and ETX); each side acknowledges a frame with ACK or refuses
 *          it with NAK, and an unacknowledged frame is resent.
 * Boundary: main only, with no native module (ADR 0253 decision 3); `node:net` loads when a call runs, so the entry
 *           stays loadable anywhere. It carries bytes and never reads them: the payload, the provider's protocol and
 *           its timing are `@stackra/payments`' (`EcrTerminalGateway`, whose structural `EcrLink` this class
 *           satisfies without either package importing the other, ADR 0377 decision 1). Serial, USB and Bluetooth
 *           links need native transports and are not here. Both link calls reject on a timeout, a refused frame after
 *           the retries, or a dropped connection. Pairing refuses with `unavailable` (capability `card_terminal`).
 * Runtime: node
 * Governing contract: ADR 0377 (decisions 1 and 2); ADR 0339 (decision 1 and open question 1); ADR 0253 (decisions 2
 *                     to 4).
 */
import { PlatformCapability } from "@stackra/platform";
import type { Socket } from "node:net";

import { Driver } from "@stackra/container";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { TerminalState } from "#contracts/enums/terminal-state.enum";
import { CardTerminal } from "#contracts/ports/card-terminal.port";
import type { PairedTerminal } from "#contracts/types/paired-terminal.type";
import type { TerminalPairing } from "#contracts/types/terminal-pairing.type";
import { refuse } from "#core/functions/refuse.function";

/** Start of a frame. */
const STX = 0x02;
/** End of a frame's payload. */
const ETX = 0x03;
/** A frame accepted. */
const ACK = 0x06;
/** A frame refused. */
const NAK = 0x15;

/** How long the terminal has to accept the connection, in milliseconds. */
const CONNECT_TIMEOUT = 5000;

/** The link timing the payments driver passes (its `EcrTiming`, restated structurally). */
interface LinkTiming {
  readonly answerMs: number;
  readonly ackMs: number;
  readonly retries: number;
}

/** The XOR of `bytes`. */
function lrcOf(bytes: Iterable<number>): number {
  let check = 0;
  for (const byte of bytes) check ^= byte;
  return check;
}

/**
 * A semi-integrated card terminal on the network, reached from main.
 *
 * @example
 * // generated main-process wiring, desktop target
 * { port: CardTerminal, selectedBy: "config:peripherals.cardTerminal", candidates: { ecr: () => import("@stackra/peripherals/desktop").then((m) => m.EcrCardTerminalDriver) } }
 * await terminal.pair({ terminalId: "T-0042", provider: "geidea", address: "tcp://10.0.0.30:6000" });
 * const gateway = new EcrTerminalGateway({ id, profile, link: terminal, currency: "SAR" }); // @stackra/payments
 */
export class EcrCardTerminalDriver extends Driver(CardTerminal) {
  /** The paired terminal; null when none is paired. */
  private paired: TerminalPairing | null = null;

  /** The open connection; null until a call needs it. */
  private socket: Socket | null = null;

  /** Bytes read and not yet parsed. */
  private buffer: number[] = [];

  /** Settles the frame being sent: true on ACK, false on NAK. */
  private onAck: ((acked: boolean) => void) | null = null;

  /** Takes the answer frame being waited for. */
  private onFrame: ((payload: Uint8Array) => void) | null = null;

  /** Rejects every waiter when the connection drops. */
  private readonly waiters = new Set<(error: Error) => void>();

  /** How many exchanges are running. */
  private running = 0;

  /** Pairs to the terminal at `pairing.address` once a connection opens. */
  async pair(pairing: TerminalPairing): Promise<CapabilityResult<PairedTerminal>> {
    if (pairing.address === null || !pairing.address.startsWith("tcp://"))
      return refuse(PlatformCapability.CardTerminal, "unavailable");
    this.close();
    this.paired = pairing;
    try {
      await this.connect();
    } catch {
      this.paired = null;
      return refuse(PlatformCapability.CardTerminal, "unavailable");
    }
    return this.status();
  }

  /** Busy while an exchange runs; otherwise ready when a connection opens, offline when it does not. */
  async status(): Promise<CapabilityResult<PairedTerminal>> {
    if (this.paired === null) return refuse(PlatformCapability.CardTerminal, "unavailable");
    const { terminalId, provider } = this.paired;
    let state: TerminalState = TerminalState.Busy;
    if (this.running === 0) {
      try {
        await this.connect();
        state = TerminalState.Ready;
      } catch {
        state = TerminalState.Offline;
      }
    }
    return { ok: true, data: { terminalId, provider, state } };
  }

  /** Closes the connection and forgets the terminal. */
  async unpair(): Promise<CapabilityResult> {
    this.close();
    this.paired = null;
    return { ok: true, data: undefined };
  }

  /**
   * Sends `payload` and resolves with the terminal's answer payload.
   *
   * @throws Error on no acknowledgement after `timing.retries`, no answer within `timing.answerMs`, or a dropped link.
   */
  async exchange(payload: Uint8Array, timing: LinkTiming): Promise<Uint8Array> {
    this.running += 1;
    try {
      const answer = this.waitFor<Uint8Array>((take) => {
        this.onFrame = take;
      }, timing.answerMs);
      // An unread answer must not surface as an unhandled rejection while the frame is still being sent.
      answer.catch(() => undefined);
      await this.send(payload, timing);
      return await answer;
    } finally {
      this.running -= 1;
    }
  }

  /**
   * Sends `payload` beside a running exchange and resolves once the terminal acknowledges it.
   *
   * @throws Error on no acknowledgement after `timing.retries`, or a dropped link.
   */
  async signal(payload: Uint8Array, timing: LinkTiming): Promise<void> {
    await this.send(payload, timing);
  }

  /** Writes the frame of `payload` until the terminal acknowledges it. */
  private async send(payload: Uint8Array, timing: LinkTiming): Promise<void> {
    const socket = await this.connect();
    const body = [...payload, ETX];
    const frame = Uint8Array.from([STX, ...body, lrcOf(body)]);
    for (let attempt = 0; ; attempt += 1) {
      const acked = this.waitFor<boolean>((settle) => {
        this.onAck = settle;
      }, timing.ackMs).catch(() => false);
      socket.write(frame);
      if (await acked) return;
      if (attempt >= timing.retries) throw new Error("ECR terminal did not acknowledge");
    }
  }

  /** Reads ACK, NAK and frames out of the bytes received; acknowledges a good frame and refuses a bad one. */
  private read(chunk: Uint8Array): void {
    this.buffer.push(...chunk);
    while (this.buffer.length > 0) {
      const first = this.buffer[0];
      if (first === ACK || first === NAK) {
        this.buffer.shift();
        this.onAck?.(first === ACK);
        this.onAck = null;
        continue;
      }
      if (first !== STX) {
        this.buffer.shift();
        continue;
      }
      const end = this.buffer.indexOf(ETX);
      if (end === -1 || end + 1 >= this.buffer.length) return;
      const frame = this.buffer.splice(0, end + 2);
      const body = frame.slice(1, -1);
      if (lrcOf(body) !== frame.at(-1)) {
        this.socket?.write(Uint8Array.of(NAK));
        continue;
      }
      this.socket?.write(Uint8Array.of(ACK));
      this.onFrame?.(Uint8Array.from(body.slice(0, -1)));
      this.onFrame = null;
    }
  }

  /** The open connection to the paired terminal, opening one when there is none. */
  private async connect(): Promise<Socket> {
    if (this.socket !== null) return this.socket;
    const address = this.paired?.address;
    if (address === null || address === undefined) throw new Error("No card terminal is paired");
    const { createConnection } = await import("node:net");
    const url = new URL(address);
    const host = url.hostname.replaceAll(/^\[|\]$/g, "");
    const socket = await new Promise<Socket>((resolve, reject) => {
      const opened = createConnection({ host, port: Number(url.port) });
      opened.setTimeout(CONNECT_TIMEOUT, () => opened.destroy(new Error(`${address} timed out`)));
      opened.once("error", reject);
      opened.once("connect", () => {
        opened.setTimeout(0);
        resolve(opened);
      });
    });
    socket.on("data", (chunk: Uint8Array) => this.read(chunk));
    // `on`, not `once`: a second error (a reset after the close) must not reach main as an unhandled event.
    socket.on("error", () => this.drop(socket));
    socket.on("close", () => this.drop(socket));
    this.socket = socket;
    return socket;
  }

  /** Forgets `socket` and rejects whoever waits on it. */
  private drop(socket: Socket): void {
    if (this.socket !== socket) return;
    this.socket = null;
    this.buffer = [];
    for (const reject of this.waiters) reject(new Error("ECR terminal link dropped"));
  }

  /** Closes the connection, if one is open. */
  private close(): void {
    const socket = this.socket;
    if (socket === null) return;
    this.drop(socket);
    socket.destroy();
  }

  /** A promise `register` settles, rejected after `ms` or when the link drops. */
  private waitFor<T>(register: (settle: (value: T) => void) => void, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const fail = (error: Error): void => {
        clearTimeout(timer);
        this.waiters.delete(fail);
        reject(error);
      };
      const timer = setTimeout(() => fail(new Error("ECR terminal timed out")), ms);
      this.waiters.add(fail);
      register((value) => {
        clearTimeout(timer);
        this.waiters.delete(fail);
        resolve(value);
      });
    });
  }
}
