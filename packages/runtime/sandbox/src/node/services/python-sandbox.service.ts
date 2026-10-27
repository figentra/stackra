/**
 * Stackra file contract:
 * Purpose: `PythonSandbox`, the Pyodide engine of a sandbox process: it loads Pyodide once for the process, then runs a
 *          Python code step (the body of `async def step(input)`) with the same `SandboxRequest`, limits, refusals and
 *          `SandboxFetchProxy` as the JavaScript `Sandbox`: JSON in and out, `print` lines as logs, `await fetch(url,
 *          init)` through the allow-listed proxy, and `codeMs` on every result and refusal.
 * Boundary: node only, internal to a `SandboxPool` process; never bound or run in a host. One Python interpreter cannot
 *           isolate runs from each other (shared `sys.modules` and builtins), and Pyodide's FFI can reach the process's
 *           JavaScript, so the process is the boundary: the pool gives a process one Python run and then replaces it,
 *           spawns it with an empty environment, and checks every relayed fetch's origin again. No host filesystem is
 *           mounted (Pyodide's own in-memory one is dropped with the process) and no package is loaded beyond the
 *           standard library. Limits are the run's: `time` while Python awaits (a loop that never awaits is stopped
 *           by the pool's watchdog at the limit plus the grace), `memoryBytes` as the growth of WebAssembly memory
 *           during the run, `outputBytes` over the result and the printed lines.
 * Runtime: node
 * Governing contract: ADR 0434 (decisions 1 and 2); ADR 0154 (decisions 1 to 8).
 */
import { Service } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import type { Json } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import type { Refusal } from "@stackra/errors";

import type { loadPyodide } from "pyodide";

import type { SandboxFetchProxy } from "#contracts/index";
import {
  SandboxCodeFailedError,
  SandboxLimitExceededError,
  type SandboxLimit,
  type SandboxRequest,
  type SandboxResult,
} from "#core/index";
import { originOf } from "#core/functions/origin-of.function";
import { toFetchRequest } from "#core/functions/to-fetch-request.function";

/** The loaded Pyodide of this process. */
type Pyodide = Awaited<ReturnType<typeof loadPyodide>>;

/** The harness's `run(code, input_text, host_fetch)`: the step's result as JSON text. */
type Run = (
  code: string,
  inputText: string,
  hostFetch: (url: unknown, init: unknown) => Promise<string>,
) => Promise<string>;

/**
 * The harness, evaluated once per process in its own namespace. The step's body is parsed, wrapped in `async def
 * step(input)` as a syntax tree (so its strings and line numbers stay as written), and run in a fresh namespace. The
 * JSON functions are taken before any tenant code runs; `allow_nan=False` keeps the output strict JSON.
 */
const HARNESS = `
import ast, builtins, json

_loads = json.loads
_dumps = json.dumps

def _compile(code):
    tree = ast.parse(code, "code-step.py")
    step = ast.AsyncFunctionDef(
        name="step",
        args=ast.arguments(posonlyargs=[], args=[ast.arg(arg="input")], kwonlyargs=[], kw_defaults=[], defaults=[]),
        body=tree.body or [ast.Pass()],
        decorator_list=[],
        returns=None,
        type_params=[],
    )
    module = ast.Module(body=[step], type_ignores=[])
    ast.fix_missing_locations(module)
    return compile(module, "code-step.py", "exec")

async def run(code, input_text, host_fetch):
    async def fetch(url, init=None):
        return _loads(await host_fetch(url, None if init is None else _dumps(init)))
    namespace = {"__builtins__": builtins, "__name__": "code_step", "fetch": fetch}
    exec(_compile(code), namespace)
    return _dumps(await namespace["step"](_loads(input_text)), allow_nan=False)
`;

const encoder = new TextEncoder();

/** Python errors that mean the run passed its memory. */
const MEMORY_ERRORS = /^(MemoryError|RecursionError)\b/;

/** The memory budget of the run in progress, read by the `grow` guard; `undefined` between runs. */
let budget:
  | { readonly bytes: number; readonly base: Map<WebAssembly.Memory, number>; over: boolean }
  | undefined;

/**
 * Refuses WebAssembly memory growth past the run's budget. Emscripten catches the throw, so the allocation fails and
 * Python raises `MemoryError`. Installed once per process; QuickJS runs in the same process only between Python runs.
 *
 * shortcut: counts growth Emscripten asks JavaScript for (`emscripten_resize_heap`); a build that grows memory inside
 * WebAssembly bypasses it. The process is single-use for Python, so it contains that; revisit if Pyodide changes it.
 */
function guardMemoryGrowth(): void {
  const grow = WebAssembly.Memory.prototype.grow;
  WebAssembly.Memory.prototype.grow = function guardedGrow(
    this: WebAssembly.Memory,
    pages: number,
  ) {
    if (budget !== undefined) {
      const base = budget.base.get(this) ?? this.buffer.byteLength;
      budget.base.set(this, base);
      if (this.buffer.byteLength + pages * 65_536 - base > budget.bytes) {
        budget.over = true;
        throw new RangeError("sandbox memory limit");
      }
    }
    return grow.call(this, pages);
  };
}

/** A Python error as `Type: message` (its last traceback line), or the thrown value as text. */
function describe(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const lines = error.message.trim().split("\n");
  return lines.at(-1)?.trim() || error.name;
}

/**
 * Runs Python code steps in a sandbox process.
 *
 * @example
 * const python = new PythonSandbox(proxy);
 * await python.load(); // once, before the run's clock starts
 * const { output, codeMs } = await python.run({ ...request, language: "python" });
 */
export class PythonSandbox extends Service {
  /** The audited egress of `fetch`. */
  private readonly proxy: SandboxFetchProxy;

  private loading: Promise<{ pyodide: Pyodide; run: Run }> | undefined;

  /**
   * @param proxy - the process's relay to the pool's `SandboxFetchProxy`.
   */
  constructor(proxy: SandboxFetchProxy) {
    super();
    this.proxy = proxy;
  }

  /** Loads Pyodide and the harness, once for the process; later calls share the first load. */
  load(): Promise<{ pyodide: Pyodide; run: Run }> {
    this.loading ??= (async () => {
      const { loadPyodide } = await import("pyodide");
      const pyodide = await loadPyodide();
      guardMemoryGrowth();
      const namespace = pyodide.globals.get("dict")();
      pyodide.runPython(HARNESS, { globals: namespace });
      const run = namespace.get("run") as Run;
      namespace.destroy();
      return { pyodide, run };
    })();
    return this.loading;
  }

  /**
   * Runs `request.code` as Python on `request.input` within `request.limits`.
   *
   * @throws SandboxCodeFailedError when the code does not compile, raises, or returns a value that is not JSON.
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
    const { pyodide, run } = await this.load();
    const started = performance.now();
    const elapsed = (): number => Math.round(performance.now() - started);
    const logs: string[] = [];
    let outputLeft = request.limits.outputBytes;
    let overflowed = false;
    const spend = (text: string): boolean => {
      outputLeft -= encoder.encode(text).length;
      overflowed ||= outputLeft < 0;
      return !overflowed;
    };
    const print = {
      batched: (line: string): void => {
        if (!spend(line)) throw new RangeError("output limit exceeded");
        logs.push(line);
      },
    };
    pyodide.setStdout(print);
    pyodide.setStderr(print);
    const abort = new AbortController();
    const hostFetch = async (url: unknown, init: unknown): Promise<string> => {
      const fetchRequest = toFetchRequest(
        url,
        typeof init === "string" ? JSON.parse(init) : undefined,
        origins,
      );
      return JSON.stringify(await this.proxy.fetch(fetchRequest, request.reference, abort.signal));
    };
    const limit = (name: SandboxLimit): Refusal =>
      SandboxLimitExceededError.create({ limit: name, codeMs: elapsed() });
    let timer: NodeJS.Timeout | undefined;
    const timedOut = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(limit("time")), milliseconds);
    });
    budget = { bytes: request.limits.memoryBytes, base: new Map(), over: false };
    const memory = budget;
    try {
      const step = Promise.resolve(run(request.code, JSON.stringify(request.input), hostFetch));
      // A step still running when the clock stops settles later; unhandled, it would end the process before the reply.
      step.catch(() => undefined);
      const text = await Promise.race([step, timedOut]);
      if (!spend(text)) throw limit("output");
      return { output: JSON.parse(text) as Json, logs: [...logs], codeMs: elapsed() };
    } catch (error) {
      if (isRefusal(error)) throw error;
      const failure = describe(error);
      if (memory.over || MEMORY_ERRORS.test(failure)) throw limit("memory");
      if (performance.now() - started > milliseconds) throw limit("time");
      if (overflowed) throw limit("output");
      throw SandboxCodeFailedError.create({ failure, logs: [...logs], codeMs: elapsed() });
    } finally {
      clearTimeout(timer);
      abort.abort();
      budget = undefined;
    }
  }
}
