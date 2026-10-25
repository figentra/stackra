/**
 * Stackra file contract:
 * Purpose: the `TabularReader` port: streams the rows of a tabular file (a CSV file, a workbook) from its bytes.
 * Boundary: an abstract class that is its own token, keyed `data-transfer.TabularReader`. A driver per format (`csv`,
 *           `xlsx`) implements it; a caller picks the driver from the file's type. A driver never holds the whole
 *           file, refuses past the limits, and yields each sheet's header as its first row.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decisions 2 to 4); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { TabularReadOptions } from "#contracts/types/tabular-read-options.type";
import type { TabularRow } from "#contracts/types/tabular-row.type";
import type { TabularSource } from "#contracts/types/tabular-source.type";

/**
 * Reads rows from a tabular file.
 *
 * @example
 * for await (const row of reader.read(upload, { fallbackEncoding: pack.legacyEncoding, limits })) { ... }
 */
export abstract class TabularReader extends Port {
  /** Type-only port key, so `DriverName<TabularReader>` narrows to this port's drivers. */
  declare readonly "~key": "data-transfer.TabularReader";

  /**
   * The rows of `source`, sheet by sheet, header first.
   *
   * @throws TransferLimitExceededError past a limit of `options.limits`.
   * @throws UnreadableEncodingError when a CSV file's encoding cannot be detected or its bytes do not decode.
   */
  abstract read(source: TabularSource, options?: TabularReadOptions): AsyncIterable<TabularRow>;
}
