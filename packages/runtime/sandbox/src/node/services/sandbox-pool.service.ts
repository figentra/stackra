/**
 * Stackra file contract:
 * Purpose: `SandboxPool`, the process-isolated runner of code steps: a fixed number of child processes, each running
 *          one `Sandbox` run at a time, a queue for the rest, the guest's fetches relayed back to the host's audited
 *          `SandboxFetchProxy`, and a watchdog that kills a process whose run outlives its time limit by the grace.
 * Boundary: node only. A crash of the WebAssembly engine, a runaway native allocation or a hung host call takes down
 *           one child, never the host; the child is replaced and only its run is refused. Runs in one process are
 *           sequential and each gets a fresh QuickJS runtime, so no state passes between runs. The pool size and the
 *           grace are the host's deployment settings; every run limit is still the run's own (`SandboxLimits`). A
 *           Python engine is not here yet (ADR 0434 decision 1 waits on the owner).
 * Runtime: node
 * Governing contract: ADR 0434 (decision 2); ADR 0154 (decisions 1, 5 and 6); ADR 0294 (decision 16).
 */
import { type ChildProcess, spawn } from "node:child_process";

import { Service } from "@stackra/container";
import { Duration } from "@stackra/contracts";

import type { SandboxFetchProxy } from "#contracts/index";
import {
  SandboxCodeFailedError,
  SandboxLimitExceededError,
  type SandboxRequest,
  type SandboxResult,
} from "#core/index";
import type { PoolReply } from "#node/types/pool-reply.type";
import type { PoolRequest } from "#node/types/pool-request.type";
import type { SandboxPoolOptions } from "#node/types/sandbox-pool-options.type";

/** One queued or running run. */
interface Job {
  readonly request: SandboxRequest;
  readonly resolve: (result: SandboxResult) => void;
  readonly reject: (error: Error) => void;
}

/** One process and the run it is on. */
interface Slot {
  readonly child: ChildProcess;
  running?:
    | (Job & {
        readonly started: number;
        readonly timer: NodeJS.Timeout;
        readonly abort: AbortController;
      })
    | undefined;
}

/**
 * Runs code steps in a pool of processes.
 *
 * @example
 * pool.open({ size: settings.sandboxProcesses, graceMs: settings.sandboxGraceMs });
 * const { output, codeMs } = await pool.run({ code, input, limits, allowedOrigins, reference: ctx.stepKey });
 * await pool.close();
 */
export class SandboxPool extends Service {
  /** The audited egress every relayed `fetch` goes through. */
  private readonly proxy: SandboxFetchProxy;

  private options: SandboxPoolOptions | undefined;

  private readonly slots: Slot[] = [];

  private readonly queue: Job[] = [];

  private isClosing = false;

  /**
   * @param proxy - the egress the host binds for `SandboxFetchProxy`.
   */
  constructor(proxy: SandboxFetchProxy) {
    super();
    this.proxy = proxy;
  }

  /**
   * Starts `options.size` processes.
   *
   * @throws RangeError when the size is not a whole number from 1 or the grace is negative.
   * @throws TypeError when the pool is already open.
   */
  open(options: SandboxPoolOptions): void {
    if (this.options !== undefined) throw new TypeError("The sandbox pool is already open");
    if (!Number.isInteger(options.size) || options.size < 1)
      throw new RangeError(
        `A sandbox pool has a whole number of processes from 1, not ${options.size}`,
      );
    if (!(options.graceMs >= 0))
      throw new RangeError(
        `A sandbox pool's grace is zero or more milliseconds, not ${options.graceMs}`,
      );
    this.options = options;
    for (let index = 0; index < options.size; index += 1) this.slots.push(this.spawn());
  }

  /**
   * Runs `request` in the next free process.
   *
   * @throws TypeError when the pool is not open or is closing.
   * @throws SandboxCodeFailedError and SandboxLimitExceededError as `Sandbox.run` does; a process that dies mid-run is
   *         `SandboxCodeFailedError`, one the watchdog kills is `SandboxLimitExceededError` with limit `time`.
   */
  run(request: SandboxRequest): Promise<SandboxResult> {
    if (this.options === undefined || this.isClosing)
      return Promise.reject(new TypeError("The sandbox pool is not open"));
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.dispatch();
    });
  }

  /** Refuses the queued runs, kills every process and waits for them to exit. */
  async close(): Promise<void> {
    this.isClosing = true;
    for (const job of this.queue.splice(0)) job.reject(new TypeError("The sandbox pool closed"));
    const exits = this.slots.map(
      (slot) =>
        new Promise<void>((resolve) => {
          if (slot.child.exitCode !== null || slot.child.signalCode !== null) resolve();
          else slot.child.once("exit", () => resolve());
        }),
    );
    for (const slot of this.slots) slot.child.kill("SIGKILL");
    await Promise.all(exits);
    this.slots.length = 0;
    this.options = undefined;
    this.isClosing = false;
  }

  /** Starts one process that serves the pool. */
  private spawn(): Slot {
    const options = this.options;
    if (options === undefined) throw new TypeError("The sandbox pool is not open");
    const module = options.module ?? import.meta.resolve("@stackra/sandbox/node");
    const script = `const m = await import(${JSON.stringify(module)}); m.serveSandboxChild();`;
    const child = spawn(
      process.execPath,
      [...(options.execArgv ?? process.execArgv), "--input-type=module", "--eval", script],
      { stdio: ["ignore", "inherit", "inherit", "ipc"], serialization: "json" },
    );
    const slot: Slot = { child };
    child.on("message", (message: PoolReply) => this.answer(slot, message));
    child.on("exit", () => this.lost(slot));
    return slot;
  }

  /** Hands queued runs to free processes. */
  private dispatch(): void {
    const options = this.options;
    if (options === undefined) return;
    for (const slot of this.slots) {
      if (slot.running !== undefined) continue;
      const job = this.queue.shift();
      if (job === undefined) return;
      const limit = Duration.toMilliseconds(job.request.limits.time);
      const timer = setTimeout(() => {
        const running = slot.running;
        if (running === undefined) return;
        slot.running = undefined;
        running.abort.abort();
        running.reject(
          SandboxLimitExceededError.create({
            limit: "time",
            codeMs: Math.round(performance.now() - running.started),
          }),
        );
        slot.child.kill("SIGKILL");
      }, limit + options.graceMs);
      slot.running = { ...job, started: performance.now(), timer, abort: new AbortController() };
      const message: PoolRequest = { type: "run", request: job.request };
      slot.child.send(message);
    }
  }

  /** Handles one message of a process. */
  private answer(slot: Slot, message: PoolReply): void {
    const running = slot.running;
    if (running === undefined) return;
    if (message.type === "fetch") {
      this.proxy.fetch(message.request, message.reference, running.abort.signal).then(
        (response) => this.post(slot, { type: "fetched", fetchId: message.fetchId, response }),
        (error: unknown) =>
          this.post(slot, {
            type: "fetch-failed",
            fetchId: message.fetchId,
            message: error instanceof Error ? error.message : String(error),
          }),
      );
      return;
    }
    clearTimeout(running.timer);
    running.abort.abort();
    slot.running = undefined;
    if (message.type === "result") running.resolve(message.result);
    else if (message.type === "limit")
      running.reject(
        SandboxLimitExceededError.create({ limit: message.limit, codeMs: message.codeMs }),
      );
    else if (message.type === "failed")
      running.reject(
        SandboxCodeFailedError.create({
          failure: message.failure,
          logs: message.logs,
          codeMs: message.codeMs,
        }),
      );
    else running.reject(Object.assign(new Error(message.message), { name: message.name }));
    this.dispatch();
  }

  /** Sends `message` to a process that may have died meanwhile. */
  private post(slot: Slot, message: PoolRequest): void {
    if (slot.child.connected) slot.child.send(message);
  }

  /** Replaces a process that exited, refusing the run it was on. */
  private lost(slot: Slot): void {
    const running = slot.running;
    if (running !== undefined) {
      clearTimeout(running.timer);
      running.abort.abort();
      slot.running = undefined;
      running.reject(
        SandboxCodeFailedError.create({
          failure: "The sandbox process exited",
          logs: [],
          codeMs: Math.round(performance.now() - running.started),
        }),
      );
    }
    const index = this.slots.indexOf(slot);
    if (index === -1 || this.isClosing || this.options === undefined) return;
    this.slots[index] = this.spawn();
    this.dispatch();
  }
}
