/**
 * Stackra file contract:
 * Purpose: `parseTestbedBoxes(json)`, the running testbed instances from `aws ec2 describe-instances` output (an array
 *          of `{ id, ip, group, launch }`), numbered by launch time.
 * Boundary: pure; unparsable output or a row without an address gives no box, never a throw.
 * Runtime: node
 * Governing contract: ADR 0484 (the testbed); ADR 0282 (decision 3).
 */
import type { TestbedBox } from "#node/types/testbed-box.type";

/**
 * The boxes in `json`, oldest launch first (box 1 is the oldest).
 *
 * @param json - the `--query` result of `aws ec2 describe-instances`.
 * @example
 * parseTestbedBoxes('[{"id":"i-1","ip":"1.2.3.4","group":"heavy","launch":"2026-10-30T00:00:00Z"}]');
 */
export function parseTestbedBoxes(json: string): readonly TestbedBox[] {
  let rows: unknown;
  try {
    rows = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(rows)) return [];
  const boxes: TestbedBox[] = [];
  for (const row of rows as Record<string, unknown>[]) {
    if (typeof row?.["id"] !== "string" || typeof row["ip"] !== "string") continue;
    boxes.push({
      id: row["id"],
      ip: row["ip"],
      group: typeof row["group"] === "string" ? row["group"] : "",
      launchedAt: Date.parse(String(row["launch"])) || 0,
    });
  }
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return boxes.sort((a, b) => a.launchedAt - b.launchedAt || a.id.localeCompare(b.id));
}
