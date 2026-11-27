/**
 * Stackra file contract:
 * Purpose: `oasdiffBreaks(base, next, oasdiff)`, the breaking changes `oasdiff breaking` finds from one OpenAPI
 *          document to the next: each change it reports, at every level, as a `ContractBreak`.
 * Boundary: writes the two documents to a throwaway folder under the OS temp directory, removed afterwards, and starts
 *           `oasdiff` once. A missing binary is an error naming the pin to install; an `oasdiff` failure (an
 *           unreadable document) is an error with its first line of output, never an empty result.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: `oasdiff` contract checks); STA-2837.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { OpenApiDocument } from "@stackra/gen";

import { OASDIFF_PIN } from "#node/contract/constants/oasdiff-pin.constant";
import type { ContractBreak } from "#node/contract/types/contract-break.type";
import { runCaptured } from "#node/functions/run-captured.function";

/** One change as `oasdiff breaking --format json` prints it; only the fields a `ContractBreak` keeps. */
type OasdiffChange = {
  readonly id?: unknown;
  readonly level?: unknown;
  readonly operation?: unknown;
  readonly path?: unknown;
  readonly text?: unknown;
};

/** The first line of `text`, trimmed. */
const first = (text: string): string => text.trim().split("\n")[0] ?? "";

/**
 * The breaking changes from `base` to `next`.
 *
 * @param base - the earlier document.
 * @param next - the later document.
 * @param oasdiff - the binary to start (`oasdiff` from PATH by default).
 * @throws Error when `oasdiff` cannot start, fails, or prints something that is not its JSON report.
 * @example
 * await oasdiffBreaks(before, after); // [{ id: "api-path-removed-without-deprecation", level: 3, operation: "POST", path: "/invoices", text: "…" }]
 */
export async function oasdiffBreaks(
  base: OpenApiDocument,
  next: OpenApiDocument,
  oasdiff = "oasdiff",
): Promise<ContractBreak[]> {
  const folder = mkdtempSync(join(tmpdir(), "stackra-contract-"));
  try {
    writeFileSync(join(folder, "base.json"), JSON.stringify(base));
    writeFileSync(join(folder, "next.json"), JSON.stringify(next));
    const output = await runCaptured(
      oasdiff,
      ["breaking", "base.json", "next.json", "--format", "json"],
      folder,
    );
    if (output === undefined) {
      throw new Error(
        `${oasdiff} is not installed: run \`mise install ${OASDIFF_PIN}\` (mise.toml pins it), or pass --oasdiff <path>`,
      );
    }
    if (output.code !== 0) {
      throw new Error(
        `${oasdiff} breaking failed (exit ${output.code}): ${first(output.stderr) || first(output.stdout)}`,
      );
    }
    const text = output.stdout.trim();
    let changes: unknown;
    try {
      changes = text === "" ? [] : (JSON.parse(text) ?? []);
    } catch {
      throw new Error(`${oasdiff} breaking printed no JSON report: ${first(text)}`);
    }
    if (!Array.isArray(changes))
      throw new Error(`${oasdiff} breaking printed ${typeof changes}, not a list of changes`);
    return (changes as OasdiffChange[]).map((change) => ({
      id: String(change.id ?? ""),
      level: typeof change.level === "number" ? change.level : 0,
      operation: String(change.operation ?? ""),
      path: String(change.path ?? ""),
      text: String(change.text ?? ""),
    }));
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}
