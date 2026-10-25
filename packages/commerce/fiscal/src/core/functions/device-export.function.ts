/**
 * Stackra file contract:
 * Purpose: `deviceExport`, a fiscal device's own journal export (a TSE archive, a module or printer dump) asked for
 *          the time span of the given records.
 * Boundary: an async function over `FiscalDevice`; the device holds the authoritative journal, so this package only
 *           relays it, base64 as the device returns it.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 5 and 7).
 */
import { z } from "zod";

import type { FiscalDevice } from "#contracts/ports/fiscal-device.port";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";
import type { JournalExport } from "#contracts/types/journal-export.type";
import { parseDeviceAnswer } from "#core/functions/parse-device-answer.function";

/** The export answer every device driver expects. */
const EXPORT_ANSWER = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  content: z.string(),
});

/**
 * The device's export file; an empty base64 file when there are no records.
 *
 * @example
 * return deviceExport(this.device, "tse.export", records, context.unitId, this.key);
 * @throws FiscalAuthorityUnavailableError when the device answers in another shape.
 */
export async function deviceExport(
  device: FiscalDevice,
  command: string,
  records: readonly FiscalRecord[],
  unitId: string,
  driver: string,
): Promise<JournalExport> {
  const first = records[0];
  const last = records.at(-1);
  if (!first || !last)
    return {
      fileName: `${unitId}.${driver}.empty`,
      contentType: "application/octet-stream",
      encoding: "base64",
      content: "",
    };
  const answer = parseDeviceAnswer(
    EXPORT_ANSWER,
    await device.call(unitId, command, {
      from: first.sealedAt.toISOString(),
      to: last.sealedAt.toISOString(),
      fromSequence: first.sequence,
      toSequence: last.sequence,
    }),
    driver,
  );
  return {
    fileName: answer.fileName,
    contentType: answer.contentType,
    encoding: "base64",
    content: answer.content,
  };
}
