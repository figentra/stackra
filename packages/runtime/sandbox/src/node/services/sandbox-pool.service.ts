/**
 * Stackra file contract:
 * Purpose: `SandboxPool`, the process-isolated runner of code steps: a fixed number of child processes, each running
 *          one `Sandbox` run at a time, a queue for the rest, the guest's fetches relayed back to the host's audited
 *          `SandboxFetchProxy`, and a watchdog that kills a process whose run outlives its time limit by the grace,
 *          counted from when the process says it serves, so a slow start-up is never charged to a run, and a start-up
 *          deadline that kills and replaces a process that never says it serves, refusing the run queued on it.
 * Boundary: node only. A crash of the WebAssembly engine, a runaway native allocation or a hung host call takes down
 *           one child, never the host; the child is replaced and only its run is refused. Runs in one process are
 *           sequential and each gets a fresh QuickJS runtime, so no state passes between runs. The pool size and the
 *           grace and the start-up deadline are the host's deployment settings (the deadline defaults to
 *           `SANDBOX_POOL_DEFAULTS`); every run limit is still the run's own (`SandboxLimits`). A
 *           Python run (Pyodide, loaded in the process when its first Python request arrives, under the start-up
 *           deadline, its clock starting once the process says it serves again) is the last run of its
 *           process: one interpreter cannot isolate runs and Pyodide's FFI reaches the process's JavaScript, so the
 *           process is replaced after it. Processes start with an empty environment, and a relayed fetch's origin is
 *           checked again here against the run's allow-list, so a process that was broken out of cannot widen egress.
 * Runtime: node
 * Governing contract: ADR 0434 (decisions 1 and 2); ADR 0154 (decisions 1, 2, 5 and 6); ADR 0294 (decision 16);
 *                     STA-1332.
 */
import { type ChildProcess, spawn } from "node:child_process";

import { Service } from "@stackra/container";
import { Duration } from "@stackra/contracts";

import type { SandboxFetchProxy } from "#contracts/index";
import { originOf } from "#core/functions/origin-of.function";
import {
  SandboxCodeFailedError,
  SandboxLimitExceededError,
  type SandboxRequest,
  type SandboxResult,
} from "#core/index";
import { SANDBOX_POOL_DEFAULTS } from "#node/constants/sandbox-pool-defaults.constant";
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
  /** The process said it serves, so its start-up is over and a run's clock may start. */
  isReady: boolean;
  /** Kills the process if it has not said it serves by the start-up deadline; cleared on `ready` or exit. */
  startup: NodeJS.Timeout | undefined;
  running?:
    | (Job & {
        started: number;
        timer: NodeJS.Timeout | undefined;
        /** The run's clock was restarted once (a Python run's starts after Pyodide loaded); a later `ready` is ignored. */
        isRearmed: boolean;
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
   * @throws RangeError when the size is not a whole number from 1, the grace is negative or the start-up deadline is not
   *         more than 0.
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
    if (options.startupMs !== undefined && !(options.startupMs > 0))
      throw new RangeError(
        `A sandbox pool's start-up deadline is more than 0 milliseconds, not ${options.startupMs}`,
      );
    this.options = options;
    for (let index = 0; index < options.size; index += 1) this.slots.push(this.spawn());
  }

  /**
   * Runs `request` in the next free process.
   *
   * @throws TypeError when the pool is not open or is closing.
   * @throws SandboxCodeFailedError and SandboxLimitExceededError as `Sandbox.run` does; a process that dies mid-run is
   *         `SandboxCodeFailedError`, one the watchdog kills is `SandboxLimitExceededError` with limit `time`, and one
   *         that does not load Pyodide within the start-up deadline is `SandboxCodeFailedError`.
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
      // An empty environment: no host secret reaches a process that runs tenant code.
      { stdio: ["ignore", "inherit", "inherit", "ipc"], serialization: "json", env: {} },
    );
    const slot: Slot = { child, isReady: false, startup: undefined };
    slot.startup = setTimeout(
      () => this.stalled(slot),
      options.startupMs ?? SANDBOX_POOL_DEFAULTS.startupMs,
    );
    child.on("message", (message: PoolReply) => this.answer(slot, message));
    child.on("exit", () => this.lost(slot));
    return slot;
  }

  /** Hands queued runs to free processes. */
  private dispatch(): void {
    if (this.options === undefined) return;
    for (const slot of this.slots) {
      // A process the watchdog killed has not exited yet; its replacement comes from `lost`.
      if (slot.running !== undefined || slot.child.killed) continue;
      const job = this.queue.shift();
      if (job === undefined) return;
      slot.running = {
        ...job,
        started: performance.now(),
        timer: undefined,
        isRearmed: false,
        abort: new AbortController(),
      };
      if (slot.isReady) this.arm(slot);
      const message: PoolRequest = { type: "run", request: job.request };
      slot.child.send(message);
    }
  }

  /**
   * Starts the watchdog of the slot's run. A process still starting up is not charged for it: on a loaded host its
   * start-up alone can outlast a run's limit and its grace, so the clock starts once the process says it serves. A
   * Python run's process loads Pyodide first and says it serves again once loaded; until then the start-up deadline,
   * not the run's clock, bounds it, so the load is never charged to the run and a hung load still ends.
   */
  private arm(slot: Slot): void {
    const running = slot.running;
    const options = this.options;
    if (running === undefined || options === undefined) return;
    clearTimeout(running.timer);
    running.started = performance.now();
    const startupMs = options.startupMs ?? SANDBOX_POOL_DEFAULTS.startupMs;
    const isLoading = running.request.language === "python" && !running.isRearmed;
    running.timer = setTimeout(
      () => {
        if (slot.running !== running) return;
        slot.running = undefined;
        running.abort.abort();
        running.reject(
          isLoading
            ? SandboxCodeFailedError.create({
                failure: `The Python engine did not load within ${startupMs} ms`,
                logs: [],
                codeMs: 0,
              })
            : SandboxLimitExceededError.create({
                limit: "time",
                codeMs: Math.round(performance.now() - running.started),
              }),
        );
        slot.child.kill("SIGKILL");
      },
      isLoading
        ? startupMs
        : Duration.toMilliseconds(running.request.limits.time) + options.graceMs,
    );
  }

  /** Handles one message of a process. */
  private answer(slot: Slot, message: PoolReply): void {
    if (message.type === "ready") {
      clearTimeout(slot.startup);
      // Only one restart per run, so a process cannot keep its run's clock from ever running out.
      if (slot.isReady && slot.running !== undefined) {
        if (slot.running.isRearmed) return;
        slot.running.isRearmed = true;
      }
      slot.isReady = true;
      this.arm(slot);
      return;
    }
    const running = slot.running;
    if (running === undefined) return;
    if (message.type === "fetch") {
      const { url } = message.request;
      const allowed = new Set(running.request.allowedOrigins.map(originOf));
      if (!URL.canParse(url) || !allowed.has(originOf(url))) {
        this.post(slot, {
          type: "fetch-failed",
          fetchId: message.fetchId,
          message: `fetch: ${url} is not an allowed origin`,
        });
        return;
      }
      // The run's own reference, never the process's word for it, goes to the audit.
      this.proxy.fetch(message.request, running.request.reference, running.abort.signal).then(
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
    // A process that ran Python is not reused; `lost` replaces it once it exits.
    if (running.request.language === "python") slot.child.kill("SIGKILL");
    this.dispatch();
  }

  /**
   * Kills a process that did not say it serves by the start-up deadline and refuses the run queued on it; its run's
   * watchdog never armed, since that waits for `ready`. `lost` replaces it once it exits.
   */
  private stalled(slot: Slot): void {
    if (slot.isReady || slot.child.killed) return;
    const running = slot.running;
    slot.running = undefined;
    if (running !== undefined) {
      running.abort.abort();
      running.reject(
        SandboxCodeFailedError.create({
          failure: `The sandbox process did not start within ${this.options?.startupMs ?? SANDBOX_POOL_DEFAULTS.startupMs} ms`,
          logs: [],
          codeMs: 0,
        }),
      );
    }
    slot.child.kill("SIGKILL");
  }

  /** Sends `message` to a process that may have died meanwhile. */
  private post(slot: Slot, message: PoolRequest): void {
    if (slot.child.connected) slot.child.send(message);
  }

  /** Replaces a process that exited, refusing the run it was on. */
  private lost(slot: Slot): void {
    clearTimeout(slot.startup);
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
