/**
 * Stackra file contract:
 * Purpose: `APPROVED_POSTGRES_EXTENSIONS`, the values of `PostgresExtension` as a frozen list, for readers that want
 *          the approved names without walking the enum (gen's `RequiredExtensions` subset check, STA-1402).
 * Boundary: public through the `.` entry; derived, so it cannot drift from the enum.
 * Runtime: isomorphic
 * Governing contract: ADR 0160 (decision 2 and its notes).
 */
import { Enum } from "@stackra/contracts";

import { PostgresExtension } from "#core/enums/postgres-extension.enum";

/** The approved extension names, in the enum's order. */
export const APPROVED_POSTGRES_EXTENSIONS: readonly PostgresExtension[] = Object.freeze(
  Enum.values(PostgresExtension),
);
