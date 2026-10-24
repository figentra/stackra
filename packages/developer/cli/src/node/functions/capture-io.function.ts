/**
 * Stackra file contract:
 * Purpose: `captureIo()`, an io that collects everything a command and the tools it starts write, interleaved as it
 *          arrives: what `stackra mcp` hands back to an assistant as the command's output.
 * Boundary: keeps the text in memory; never writes to this process's streams, which carry the MCP protocol.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: run gen, validate and verify and explain failures).
 */
import type { CliIo } from "#node/types/cli-io.type";

/**
 * A capturing io and a reader of what it collected.
 *
 * @example
 * const { io, output } = captureIo();
 * const exitCode = await runCli(["gen", "--check"], io);
 * output(); // "src/x.ts:4:3 error shape_number_kind …"
 */
export function captureIo(): { readonly io: CliIo; readonly output: () => string } {
  let text = "";
  const write = (chunk: string): void => {
    text += chunk;
  };
  return { io: { out: write, err: write, inherit: false }, output: () => text };
}
