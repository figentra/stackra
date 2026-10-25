/**
 * Stackra file contract:
 * Purpose: `clamdResult`, the `ScanResult` of clamd's reply to `INSTREAM`: `stream: OK` is clean, `stream: <name>
 *          FOUND` is infected with that signature, anything else (`... ERROR`, an empty reply) is failed.
 * Boundary: pure; internal to the `clamav` driver.
 * Runtime: node
 * Governing contract: ADR 0354; ADR 0222.
 */
import { ScanVerdict } from "#contracts/enums/scan-verdict.enum";
import type { ScanResult } from "#contracts/types/scan-result.type";

/**
 * The result of clamd's reply.
 *
 * @example
 * clamdResult("stream: Eicar-Signature FOUND\0"); // { verdict: "infected", threats: ["Eicar-Signature"] }
 */
export function clamdResult(reply: string): ScanResult {
  const line = reply.replace(/\0/g, "").trim();
  if (line === "stream: OK") return { verdict: ScanVerdict.Clean, threats: [] };
  const found = /^stream: (.+) FOUND$/.exec(line);
  if (found?.[1] !== undefined) return { verdict: ScanVerdict.Infected, threats: [found[1]] };
  return { verdict: ScanVerdict.Failed, threats: [], detail: line === "" ? "no reply" : line };
}
