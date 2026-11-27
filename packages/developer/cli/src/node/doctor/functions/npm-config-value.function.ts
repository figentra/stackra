/**
 * Stackra file contract:
 * Purpose: `npmConfigValue(output)`, the value `pnpm config get <key> --json` printed: its last non-empty line read
 *          as JSON (a warning the package manager prints first is skipped), undefined when the key is unset
 *          (`null`, `undefined` or nothing) or the line is not a string.
 * Boundary: pure; reads registry settings only, never an auth key.
 * Runtime: node
 * Governing contract: ADR 0453 (decision 10).
 */

/**
 * The config value in the command's output.
 *
 * @param output - what `pnpm config get <key> --json` printed.
 * @example
 * npmConfigValue('"https://npm.stackra.figentra.com/"\n'); // "https://npm.stackra.figentra.com/"
 * npmConfigValue("null\n"); // undefined
 */
export function npmConfigValue(output: string): string | undefined {
  const line = output
    .split("\n")
    .map((row) => row.trim())
    .findLast((row) => row !== "");
  if (line === undefined || line === "undefined") return undefined;
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    // an older package manager prints the bare value without --json quoting
    value = line;
  }
  return typeof value === "string" && value !== "" && value !== "undefined" ? value : undefined;
}
