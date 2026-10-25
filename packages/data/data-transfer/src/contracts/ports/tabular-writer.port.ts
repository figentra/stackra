/**
 * Stackra file contract:
 * Purpose: the `TabularWriter` port: streams the bytes of a tabular file (a CSV file, a workbook) from named sheets.
 * Boundary: an abstract class that is its own token, keyed `data-transfer.TabularWriter`. A driver per format (`csv`,
 *           `xlsx`) implements it. Where the bytes go (a file disk, a signed link) and which rows a caller may see
 *           are the caller's concern.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 2 and 10); ADR 0163 (decision 4); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { TabularSheet } from "#contracts/types/tabular-sheet.type";
import type { TabularWriteOptions } from "#contracts/types/tabular-write-options.type";

/**
 * Writes a tabular file.
 *
 * @example
 * await files.writeStream(`exports/${id}.xlsx`, writer.write([{ name: "Orders", rows }]), { contentType: writer.mediaType });
 */
export abstract class TabularWriter extends Port {
  /** Type-only port key, so `DriverName<TabularWriter>` narrows to this port's drivers. */
  declare readonly "~key": "data-transfer.TabularWriter";

  /** The media type of the file it writes. */
  abstract readonly mediaType: string;

  /**
   * The file's bytes, in order.
   *
   * @throws TypeError when the format cannot hold the sheets given (a CSV file holds exactly one).
   */
  abstract write(
    sheets: readonly TabularSheet[],
    options?: TabularWriteOptions,
  ): AsyncIterable<Uint8Array>;
}
