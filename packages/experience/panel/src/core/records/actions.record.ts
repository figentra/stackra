/**
 * Stackra file contract:
 * Purpose: `ActionsRecord<R, V>`, the builder a resource's `actions(a)` member receives: the runtime side of
 *          `Actions<R, V>`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it. A run placement keeps `bulk` and `places`; the export, import and create
 *           placements keep `places` and, for create, `after`. Every placement keeps its button look (`with`).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 3, 4 and 10).
 */
import type { AnyClass } from "@stackra/container";

import { Placement } from "#core/constants/placement.constant";
import type { ExportFormat } from "#core/enums/export-format.enum";
import type { ImportMode } from "#core/enums/import-mode.enum";
import { PlacementRecord } from "#core/records/placement.record";
import type { Actions } from "#core/types/actions.type";
import type { Path } from "#core/types/path.type";

/** Builds the buttons of a resource over list row `R` and record `V`. */
export class ActionsRecord<R, V = R> implements Actions<R, V> {
  /** A button that runs `action`. */
  run(action: AnyClass): PlacementRecord {
    return new PlacementRecord(({ after: _after, ...flags }) => Placement.run(action, flags));
  }

  /** The queued export. */
  export(options: {
    readonly formats: readonly ExportFormat[];
    readonly columns?: readonly Path<R>[];
  }): PlacementRecord {
    return new PlacementRecord(({ bulk: _bulk, after: _after, ...flags }) =>
      Placement.export({ ...options, ...flags }),
    );
  }

  /** Adds an import action. */
  import(options: {
    readonly mode: ImportMode;
    readonly match: Path<V>;
    readonly maxRows?: number;
  }): PlacementRecord {
    return new PlacementRecord(({ bulk: _bulk, after: _after, ...flags }) =>
      Placement.import({ ...options, ...flags }),
    );
  }

  /** The create button. */
  create(): PlacementRecord {
    return new PlacementRecord(({ bulk: _bulk, ...flags }) => Placement.create(flags));
  }
}
