/**
 * Stackra file contract:
 * Purpose: `toolResult(tool, document, exitCode, docs?)`, the MCP result of one local tool call: `structuredContent`
 *          is a `DiagnosticReport` (`ok` and `diagnostics`) with the command's `data` and `error` beside it, and the
 *          same JSON as text. The diagnostics are the ones the command's data lists, lifted out of it, each without a
 *          link given its code's `stackra explain` link when `docs` finds one, then the command's own error (a refused
 *          input, an unknown member) as one diagnostic of the tool's phase with its code, fix and docs link.
 * Boundary: pure apart from `docs`; never drops a field of the data other than `diagnostics`. `isError` is the exit
 *           code's: a failed run is a tool error the assistant reads, not a protocol error.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); STA-1966 spec FR-020 (a command's `--json` document is its tool result);
 *                     STA-2886.
 */
import type { Diagnostic, DiagnosticReport } from "@stackra/console/contracts";

/** A JSON object, or undefined. */
const record = (value: unknown): Readonly<Record<string, unknown>> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;

/** A non-empty string field, or undefined. */
const text = (value: unknown): string | undefined =>
  typeof value === "string" && value !== "" ? value : undefined;

/** The command's `--json` error as a diagnostic of `phase`. */
function errorDiagnostic(phase: string, error: Readonly<Record<string, unknown>>): Diagnostic {
  const code = text(error["code"]);
  const why = text(error["why"]);
  const fix = text(error["fix"]);
  const docsUrl = text(error["docs"]);
  return {
    phase,
    ...(code === undefined ? {} : { code }),
    severity: "error",
    message: [text(error["message"]) ?? "the command failed", why].filter(Boolean).join(": "),
    ...(fix === undefined ? {} : { fix }),
    ...(docsUrl === undefined ? {} : { docsUrl }),
  };
}

/** `diagnostics` with each code's docs link where the finding has none. */
async function linked(
  diagnostics: readonly Diagnostic[],
  docs: ((code: string) => Promise<string | undefined>) | undefined,
): Promise<Diagnostic[]> {
  if (docs === undefined) return [...diagnostics];
  const codes = [
    ...new Set(
      diagnostics.flatMap((diagnostic) =>
        diagnostic.docsUrl === undefined && diagnostic.code !== undefined ? [diagnostic.code] : [],
      ),
    ),
  ];
  const links = new Map(
    await Promise.all(codes.map(async (code) => [code, await docs(code)] as const)),
  );
  return diagnostics.map((diagnostic) => {
    const docsUrl =
      diagnostic.docsUrl ??
      (diagnostic.code === undefined ? undefined : links.get(diagnostic.code));
    return docsUrl === undefined ? diagnostic : { ...diagnostic, docsUrl };
  });
}

/**
 * The MCP `tools/call` result of a command's `--json` document.
 *
 * @param tool - the tool's name, the phase of the command's own error.
 * @param document - the command's `{ ok, data }` or `{ ok: false, error }` document.
 * @param exitCode - its exit code.
 * @param docs - the docs link of a code (`explainDocs`); no links added when absent.
 * @example
 * const result = await toolResult("lint", { ok: true, data: { diagnostics: [] } }, 0);
 * result.structuredContent; // { ok: true, diagnostics: [], data: {} }
 */
export async function toolResult(
  tool: string,
  document: Readonly<Record<string, unknown>>,
  exitCode: number,
  docs?: (code: string) => Promise<string | undefined>,
): Promise<{
  readonly content: readonly { readonly type: "text"; readonly text: string }[];
  readonly structuredContent: DiagnosticReport & Readonly<Record<string, unknown>>;
  readonly isError: boolean;
}> {
  const data = record(document["data"]);
  const error = record(document["error"]);
  const listed = Array.isArray(data?.["diagnostics"])
    ? (data["diagnostics"] as readonly Diagnostic[])
    : [];
  const rest = Object.fromEntries(
    Object.entries(data ?? {}).filter(([key]) => key !== "diagnostics"),
  );
  const report = {
    ok: exitCode === 0 && document["ok"] !== false,
    diagnostics: [
      ...(await linked(listed, docs)),
      ...(error === undefined ? [] : [errorDiagnostic(tool, error)]),
    ],
    ...("data" in document ? { data: data === undefined ? document["data"] : rest } : {}),
    ...(error === undefined ? {} : { error }),
  };
  return {
    content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
    structuredContent: report,
    isError: exitCode !== 0,
  };
}
