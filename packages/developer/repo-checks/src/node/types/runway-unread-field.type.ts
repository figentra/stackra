/**
 * Stackra file contract:
 * Purpose: `RunwayUnreadField`, one runway field the repositories may set but nothing reads yet: its schema kind and
 *          path, the work that will read it, and the access a reader would write.
 * Boundary: type only; `RUNWAY_UNREAD_FIELDS` lists them and `checkRunwayUnreadFields` holds the list, the schema
 *           descriptions and the sources to it.
 * Runtime: node
 * Governing contract: ADR 0296; STA-2001 (Runway plan PR 6c).
 */

/** A runway field that is typed and set but not read yet. */
export type RunwayUnreadField = {
  /** The runway kind whose canonical JSON Schema declares it. */
  readonly kind: "root" | "service" | "app";

  /** The schema path, `*` for any key and `[]` for any item (`environments.*.ttl`). */
  readonly path: string;

  /** The work that will read it, as its description names it (`Runway plan PR 12, STA-2001`). */
  readonly reader: string;

  /** The access a reader would write; a match in the reader sources means the field is read now. */
  readonly access: RegExp;
};
