/**
 * Stackra file contract:
 * Purpose: `readDevSecrets(file)`, the values of a dev-secrets file by name, or undefined when there is no file.
 * Boundary: reads one file. An error names the file and never quotes its content, so no value reaches a log.
 * Runtime: node
 * Governing contract: ADR 0525 (amendment of 2026-11-10); STA-2679.
 */
import { existsSync, readFileSync } from "node:fs";

/**
 * The values `file` holds.
 *
 * @param file - an absolute path to a dev-secrets file (`DEV_SECRETS_FILE` under a workspace, or a `--from` file).
 * @throws Error when the file is not a JSON object of strings.
 * @example
 * readDevSecrets("/repo/.stackra/dev-secrets.json")?.["SESSION_SECRET"] !== undefined;
 */
export function readDevSecrets(file: string): Readonly<Record<string, string>> | undefined {
  if (!existsSync(file)) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    throw new Error(`${file} is not valid JSON`);
  }
  const entries =
    typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? Object.entries(parsed)
      : undefined;
  if (entries === undefined || !entries.every(([, value]) => typeof value === "string"))
    throw new Error(`${file} must be a JSON object of secret names to strings`);
  return Object.fromEntries(entries) as Record<string, string>;
}
