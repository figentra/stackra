/**
 * Stackra file contract:
 * Purpose: `SourceReader`, what `createSourceReader` hands discovery: one reader per kind of record (a kind class, a
 *          shape, an enum, a file's exports, the client imports) over one opened program, plus the refusals it collected.
 * Boundary: a type only. Every reader returns plain IR records; nodes, symbols and types never leave the reader.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 16, 20, 25 and 26); ADR 0305 (rules 5 to 13 and 42); STA-1293 (client imports).
 */
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { EnumIR } from "#core/types/enum-ir.type";
import type { FileExports } from "#core/types/file-exports.type";
import type { GenError } from "#core/types/gen-error.type";
import type { ShapeIR } from "#core/types/shape-ir.type";
import type { TsNode } from "#node/types/ts-node.type";

/** The readers of one program. */
export interface SourceReader {
  /** The member's own source files, sorted by path; tests only when asked for. */
  readonly sources: readonly TsNode[];

  /** The kind classes of a file, in source order. */
  classes(file: TsNode): DeclaredClass[];

  /** The shapes of a file, in source order. */
  shapes(file: TsNode): ShapeIR[];

  /** The `Enum.of` declarations of a file. */
  enums(file: TsNode): EnumIR[];

  /** The exported declarations of a file; reports `two_declarations_in_file`. */
  exports(file: TsNode): FileExports;

  /** The services any own source file (tests included) imports from `#stackra/clients/<service>`, by service. */
  clientImports(): { readonly service: string; readonly file: string }[];

  /** Every refusal reported so far. */
  readonly errors: readonly GenError[];
}
