/**
 * Stackra file contract:
 * Purpose: `Sandbox`, the service that runs one code step of a tenant's automation: the code is the body of an async
 *          function of its JSON `input`, it runs in a fresh QuickJS-WASM runtime and context, and its returned value
 *          comes back as JSON with the lines it logged and the milliseconds it ran (metered `automation.code_ms`).
 * Boundary: the only place tenant code runs. The guest has the ECMAScript built-ins plus `console.log` and `fetch`; no
 *           filesystem, no process, no module loader and no timers. `fetch(url, init)` reaches only the run's
 *           allow-listed origins, through the `SandboxFetchProxy` port, and resolves to a plain `{ status, headers,
 *           body }`. Every limit is the caller's data (`SandboxLimits`, from the tenant's plan): wall time (an interrupt
 *           while code runs, a timer while it waits), heap (QuickJS's memory limit, and the growth of the run's
 *           WebAssembly memory while code runs), output (result plus logs). Each run gets a fresh engine module,
 *           runtime and context, all dropped after it, so no state passes between runs. Each run is metered: a result
 *           carries `codeMs`, and so does each refusal. Not a Python runner (Pyodide is a later engine of ADR 0154).
 * Runtime: isomorphic
 * Governing contract: ADR 0154 (decisions 1 to 8); ADR 0294 (decisions 16 and 17: dependencies by constructor type);
 *                     ADR 0263 (ports resolve by type).
 */
import { Service } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import type { Json } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import type { Refusal } from "@stackra/errors";
import { newQuickJSWASMModule, RELEASE_SYNC } from "quickjs-emscripten";
import type {
  QuickJSContext,
  QuickJSEmscriptenModule,
  QuickJSDeferredPromise,
  QuickJSHandle,
  QuickJSRuntime,
  QuickJSWASMModule,
} from "quickjs-emscripten";

import type { SandboxFetchProxy, SandboxFetchRequest } from "#contracts/index";
import { SandboxCodeFailedError } from "#core/errors/sandbox-code-failed.error";
import { SandboxLimitExceededError } from "#core/errors/sandbox-limit-exceeded.error";
import type { SandboxLimit } from "#core/types/sandbox-limit.type";
import type { SandboxRequest } from "#core/types/sandbox-request.type";
import type { SandboxResult } from "#core/types/sandbox-result.type";

/**
 * The guest stack, QuickJS's own default (256 KiB): deep recursion fails as `memory` inside it, far below the
 * WebAssembly stack, so a run can never crash the engine module. An engine bound, not a plan value.
 */
const STACK_BYTES = 256 * 1024;

/**
 * A fresh engine module and a reader of its WebAssembly memory size. The quickjs-emscripten builds (0.23 to 0.32)
 * count each allocation as 8 bytes (QuickJS has no `malloc_usable_size` under Emscripten), so `setMemoryLimit` alone
 * does not bound the heap; growth of the module's own memory does.
 */
async function freshEngine(): Promise<{ engine: QuickJSWASMModule; heapBytes: () => number }> {
  let wasm: QuickJSEmscriptenModule | undefined;
  const engine = await newQuickJSWASMModule({
    ...RELEASE_SYNC,
    importModuleLoader: async () => {
      // The loader comes bare or as a (doubly) wrapped default export, as the bundling of the variant left it.
      const imported = await RELEASE_SYNC.importModuleLoader();
      const inner = typeof imported === "function" ? imported : imported.default;
      const load = typeof inner === "function" ? inner : inner.default;
      return async (options) => (wasm = await load(options));
    },
  });
  return { engine, heapBytes: () => wasm?.HEAPU8.byteLength ?? 0 };
}

/** The result of a guest evaluation or call. */
type Outcome = ReturnType<QuickJSContext["evalCode"]>;

/** Why a run stopped before its code settled. */
type Stop = { readonly limit: SandboxLimit } | { readonly failure: string };

/** One run's engine, guest handles and budgets. */
interface RunState {
  readonly runtime: QuickJSRuntime;
  readonly context: QuickJSContext;
  readonly request: SandboxRequest;
  readonly origins: ReadonlySet<string>;
  readonly started: number;
  readonly deadline: number;
  readonly abort: AbortController;
  /** `fetch` promises the guest still waits on. */
  readonly pending: Set<QuickJSDeferredPromise>;
  readonly logs: string[];
  /** The guest's own `JSON.parse` and `JSON.stringify`, taken before the code can replace them. */
  readonly parse: QuickJSHandle;
  readonly stringify: QuickJSHandle;
  /** The engine's WebAssembly memory size now, and before the code ran. */
  readonly heapBytes: () => number;
  readonly heapBase: number;
  /** The settled value or error of the code, until it is read. */
  held?: QuickJSHandle;
  outputLeft: number;
  overflowed: boolean;
  overMemory: boolean;
  closed: boolean;
  stop: (stop: Stop) => void;
}

const encoder = new TextEncoder();

/** The UTF-8 length of `text`. */
const bytesOf = (text: string): number => encoder.encode(text).length;

/**
 * The origin of `url`.
 *
 * @throws TypeError when `url` is not an absolute URL.
 */
const originOf = (url: string): string => new URL(url).origin;

/** A guest error as `Name: message`, or the thrown value as text; `Error` when even that cannot be read. */
function describe(context: QuickJSContext, error: QuickJSHandle): string {
  try {
    if (context.typeof(error) !== "object") return String(context.dump(error));
    const name = context.getProp(error, "name");
    const message = context.getProp(error, "message");
    try {
      return `${String(context.dump(name))}: ${String(context.dump(message))}`;
    } finally {
      name.dispose();
      message.dispose();
    }
  } catch {
    return "Error";
  }
}

/**
 * Runs tenant code in a sandbox.
 *
 * @example
 * constructor(sandbox: Sandbox) {
 *   super();
 *   this.sandbox = sandbox;
 * }
 *
 * const { output, codeMs } = await this.sandbox.run({ code, input, limits, allowedOrigins, reference: ctx.stepKey });
 */
export class Sandbox extends Service {
  /** The audited egress of `fetch`. */
  private readonly proxy: SandboxFetchProxy;

  /**
   * @param proxy - the egress the host binds for `SandboxFetchProxy`.
   */
  constructor(proxy: SandboxFetchProxy) {
    super();
    this.proxy = proxy;
  }

  /**
   * Runs `request.code` on `request.input` within `request.limits`, and gives back its output.
   *
   * @throws SandboxCodeFailedError when the code does not compile, throws, or returns a value that is not JSON.
   * @throws SandboxLimitExceededError when the run passes its time, memory or output limit.
   * @throws RangeError when the time limit is zero.
   * @throws TypeError when an allowed origin is not an absolute URL.
   */
  async run(request: SandboxRequest): Promise<SandboxResult> {
    const milliseconds = Duration.toMilliseconds(request.limits.time);
    if (!(milliseconds > 0))
      throw new RangeError(
        `A code step's time limit is longer than zero, not ${request.limits.time}`,
      );
    const origins = new Set(request.allowedOrigins.map(originOf));
    const { engine, heapBytes } = await freshEngine();
    const runtime = engine.newRuntime();
    const context = runtime.newContext();
    const json = context.getProp(context.global, "JSON");
    const parse = context.getProp(json, "parse");
    const stringify = context.getProp(json, "stringify");
    json.dispose();
    let stop: (stop: Stop) => void = () => {};
    const stopped = new Promise<Stop>((resolve) => {
      stop = resolve;
    });
    const started = performance.now();
    const state: RunState = {
      runtime,
      context,
      request,
      parse,
      stringify,
      heapBytes,
      heapBase: heapBytes(),
      origins,
      started,
      deadline: started + milliseconds,
      abort: new AbortController(),
      pending: new Set(),
      logs: [],
      outputLeft: request.limits.outputBytes,
      overflowed: false,
      overMemory: false,
      closed: false,
      stop: (reason) => {
        // No guest job runs once a run stopped, so nothing settles into a runtime about to be disposed.
        state.closed = true;
        stop(reason);
      },
    };
    const timer = setTimeout(() => state.stop({ limit: "time" }), milliseconds);
    try {
      return await this.execute(state, stopped);
    } catch (error) {
      if (isRefusal(error)) throw error;
      throw this.failure(state, error instanceof Error ? error.message : String(error));
    } finally {
      clearTimeout(timer);
      this.close(state);
    }
  }

  /** Sets the guest up, runs the code and reads its output. */
  private async execute(state: RunState, stopped: Promise<Stop>): Promise<SandboxResult> {
    const { context, runtime, request } = state;
    this.install(state);
    runtime.setMemoryLimit(request.limits.memoryBytes);
    runtime.setMaxStackSize(STACK_BYTES);
    // shortcut: memory grows past the module's initial size before it shows, so a run may use that slack (about
    // 16 MiB) on top of its limit, and one allocation between interrupts is not caught; the pool's process isolation
    // contains both. Drop the heap check once an engine build counts allocation sizes.
    runtime.setInterruptHandler(() => {
      state.overMemory ||= state.heapBytes() - state.heapBase > request.limits.memoryBytes;
      return state.overMemory || performance.now() > state.deadline;
    });

    const promise = this.start(state);
    const settled = context.resolvePromise(promise).then((outcome) => {
      state.held = outcome.error ?? outcome.value;
      return outcome;
    });
    promise.dispose();
    this.drain(state);

    const outcome = await Promise.race([settled, stopped]);
    if ("limit" in outcome) throw this.limit(state, outcome.limit);
    if ("failure" in outcome) throw this.failure(state, outcome.failure);
    state.closed = true;
    if (outcome.error !== undefined) throw this.failure(state, describe(context, outcome.error));
    const text = this.toText(state, outcome.value);
    const output = text === undefined ? null : (JSON.parse(text) as Json);
    if (!this.spend(state, text ?? "null")) throw this.limit(state, "output");
    return { output, logs: [...state.logs], codeMs: this.elapsed(state) };
  }

  /**
   * Compiles the code as the body of `async function (input)` and calls it on the input: the promise of its result.
   *
   * @throws the run's refusal when the code does not compile or fails before its first `await`.
   */
  private start(state: RunState): QuickJSHandle {
    const { context, request } = state;
    const input = this.toGuest(state, request.input);
    try {
      const code = this.unwrap(
        state,
        context.evalCode(`(async function (input) {\n${request.code}\n})`, "code-step.js"),
      );
      try {
        return this.unwrap(state, context.callFunction(code, context.undefined, input));
      } finally {
        code.dispose();
      }
    } finally {
      input.dispose();
    }
  }

  /** Adds `console.log` and `fetch` to the guest's globals. */
  private install(state: RunState): void {
    const { context } = state;
    const console = context.newObject();
    const log = context.newFunction("log", (...args) => {
      const line = args
        .map((arg) =>
          context.typeof(arg) === "string" ? context.getString(arg) : this.printable(state, arg),
        )
        .join(" ");
      if (!this.spend(state, line)) return { error: context.newError("output limit exceeded") };
      state.logs.push(line);
      return undefined;
    });
    context.setProp(console, "log", log);
    context.setProp(context.global, "console", console);
    log.dispose();
    console.dispose();

    const fetch = context.newFunction("fetch", (url, init) => this.fetch(state, url, init));
    context.setProp(context.global, "fetch", fetch);
    fetch.dispose();
  }

  /** The guest's `fetch`: a promise the proxy's answer settles. */
  private fetch(
    state: RunState,
    url: QuickJSHandle,
    init: QuickJSHandle | undefined,
  ): QuickJSHandle {
    const { context } = state;
    const deferred = context.newPromise();
    state.pending.add(deferred);
    void deferred.settled.then(() => {
      state.pending.delete(deferred);
      this.drain(state);
    });
    const reject = (message: string): void => {
      if (state.closed) return;
      const error = context.newError(message);
      deferred.reject(error);
      error.dispose();
    };
    let request: SandboxFetchRequest;
    try {
      request = this.fetchRequest(state, url, init);
    } catch (error) {
      reject(error instanceof Error ? error.message : String(error));
      return deferred.handle;
    }
    this.proxy.fetch(request, state.request.reference, state.abort.signal).then(
      (response) => {
        if (state.closed) return;
        try {
          const handle = this.toGuest(state, response as unknown as Json);
          deferred.resolve(handle);
          handle.dispose();
        } catch (error) {
          state.stop({ failure: error instanceof Error ? error.message : String(error) });
        }
      },
      (error: unknown) => reject(error instanceof Error ? error.message : String(error)),
    );
    return deferred.handle;
  }

  /**
   * The request a guest `fetch(url, init)` asks for.
   *
   * @throws TypeError when the arguments are malformed or the origin is not allowed for this run.
   */
  private fetchRequest(
    state: RunState,
    url: QuickJSHandle,
    init: QuickJSHandle | undefined,
  ): SandboxFetchRequest {
    const { context } = state;
    if (context.typeof(url) !== "string") throw new TypeError("fetch: the URL is a string");
    const href = context.getString(url);
    const origin = URL.canParse(href) ? originOf(href) : undefined;
    if (origin === undefined || !state.origins.has(origin))
      throw new TypeError(`fetch: ${origin ?? href} is not an allowed origin`);
    const text =
      init === undefined || context.typeof(init) === "undefined"
        ? undefined
        : this.toText(state, init);
    const options = (text === undefined ? {} : JSON.parse(text)) as Record<string, unknown>;
    const { method = "GET", headers = {}, body } = options;
    if (typeof method !== "string") throw new TypeError("fetch: the method is a string");
    if (
      typeof headers !== "object" ||
      headers === null ||
      Object.values(headers).some((value) => typeof value !== "string")
    )
      throw new TypeError("fetch: the headers are an object of strings");
    if (body !== undefined && typeof body !== "string")
      throw new TypeError("fetch: the body is a string");
    return {
      url: href,
      method: method.toUpperCase(),
      headers: headers as Record<string, string>,
      ...(body === undefined ? {} : { body }),
    };
  }

  /** Runs the guest's queued jobs, unless the run stopped; a job that cannot finish stops the run. */
  private drain(state: RunState): void {
    if (state.closed) return;
    const result = state.runtime.executePendingJobs();
    if (result.error === undefined) return;
    const failure = describe(state.context, result.error);
    result.error.dispose();
    state.stop({ failure });
  }

  /** `value` as a guest value, through the guest's own `JSON.parse`. */
  private toGuest(state: RunState, value: Json): QuickJSHandle {
    const { context } = state;
    const text = context.newString(JSON.stringify(value));
    try {
      return this.unwrap(state, context.callFunction(state.parse, context.undefined, text));
    } finally {
      text.dispose();
    }
  }

  /** The guest's own `JSON.stringify` of `handle`; `undefined` when it has no JSON form. */
  private toText(state: RunState, handle: QuickJSHandle): string | undefined {
    const { context } = state;
    const text = this.unwrap(
      state,
      context.callFunction(state.stringify, context.undefined, handle),
    );
    try {
      return context.typeof(text) === "string" ? context.getString(text) : undefined;
    } finally {
      text.dispose();
    }
  }

  /** A logged value that is not a string: its JSON, or its text form when it has none. */
  private printable(state: RunState, handle: QuickJSHandle): string {
    try {
      return this.toText(state, handle) ?? String(state.context.dump(handle));
    } catch {
      return String(state.context.dump(handle));
    }
  }

  /** Takes `text` from the output budget; `false`, and the run marked, when it does not fit. */
  private spend(state: RunState, text: string): boolean {
    state.outputLeft -= bytesOf(text);
    if (state.outputLeft >= 0) return true;
    state.overflowed = true;
    return false;
  }

  /**
   * The value of `outcome`.
   *
   * @throws the run's refusal when the guest threw.
   */
  private unwrap(state: RunState, outcome: Outcome): QuickJSHandle {
    if (outcome.error === undefined) return outcome.value;
    const failure = describe(state.context, outcome.error);
    outcome.error.dispose();
    throw this.failure(state, failure);
  }

  /** The refusal for a run that failed with `failure`: a limit when one was passed, else the code's own error. */
  private failure(state: RunState, failure: string): Refusal {
    if (state.overMemory) return this.limit(state, "memory");
    if (performance.now() > state.deadline) return this.limit(state, "time");
    if (state.overflowed) return this.limit(state, "output");
    if (/out of memory|stack overflow/i.test(failure)) return this.limit(state, "memory");
    return SandboxCodeFailedError.create({
      failure,
      logs: [...state.logs],
      codeMs: this.elapsed(state),
    });
  }

  /** The refusal for a run that passed `limit`. */
  private limit(state: RunState, limit: SandboxLimit): Refusal {
    return SandboxLimitExceededError.create({ limit, codeMs: this.elapsed(state) });
  }

  /** The run's wall time so far, in whole milliseconds. */
  private elapsed(state: RunState): number {
    return Math.round(performance.now() - state.started);
  }

  /** Aborts outstanding `fetch` calls and frees every guest handle, the context and the runtime. */
  private close(state: RunState): void {
    state.closed = true;
    state.abort.abort();
    for (const deferred of state.pending) if (deferred.alive) deferred.dispose();
    state.pending.clear();
    for (const handle of [state.held, state.parse, state.stringify])
      if (handle?.alive === true) handle.dispose();
    state.context.dispose();
    state.runtime.dispose();
  }
}
