/**
 * Stackra file contract:
 * Purpose: `TsHost`, the seam between gen's discovery and a TypeScript compiler API: the dozen questions discovery
 *          asks of a program (its files, a node's kind, text, leading and trailing trivia and position, the symbol and type at a node, a symbol's
 *          declarations, a type's alias, union members and literal value), answered by the TypeScript 7 host or the
 *          TypeScript 6 fallback with identical results.
 * Boundary: a type only. Symbols and types stay opaque (`TsSymbol`, `TsType`, each in its own file); only the host
 *           that made one reads it. A symbol is always returned de-aliased, so an import resolves to the declared
 *           class or constant.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 26: one host seam over the TypeScript 7 API with a TypeScript 6 fallback,
 *                     no ts-morph); ADR 0305 (rules 42 and 45).
 */
import type { TsNode } from "#node/types/ts-node.type";
import type { TsSymbol } from "#node/types/ts-symbol.type";
import type { TsType } from "#node/types/ts-type.type";

/** One opened TypeScript program. */
export interface TsHost {
  /** The backend, for messages: `typescript 7.0.2 (tsgo)` or `typescript 6.0.3`. */
  readonly name: string;

  /** Every source file of the program (declaration files included), in program order. */
  files: () => readonly TsNode[];

  /** The path of the source file a node belongs to. */
  fileName: (node: TsNode) => string;

  /** The node's `SyntaxKind` name; the first name of a kind number wins (`NumericLiteral`, not a marker). */
  kind: (node: TsNode) => string;

  /** The name of a kind number (a heritage token, an operator). */
  kindName: (kind: number) => string;

  /** The node's source text, trivia excluded. */
  text: (node: TsNode) => string;

  /** The trivia before the node (comments and blank lines). */
  leading: (node: TsNode) => string;

  /** The rest of the line after the node (a trailing `, // reason: …` comment), up to the line break. */
  trailing: (node: TsNode) => string;

  /** The 1-based line and column of the node's start. */
  position: (node: TsNode) => { readonly line: number; readonly column: number };

  /** Whether a property or parameter is declared with `?`. */
  isOptional: (node: TsNode) => boolean;

  /** The symbol at a node, followed through import aliases. */
  symbolAt: (node: TsNode) => TsSymbol | undefined;

  /** The symbol's name. */
  symbolName: (symbol: TsSymbol) => string;

  /** Whether the symbol carries a `SymbolFlags` flag (`Alias`, `Class`, `Optional`, `Property`, ...). */
  symbolHas: (symbol: TsSymbol, flag: string) => boolean;

  /** The symbol's declarations. */
  declarations: (symbol: TsSymbol) => readonly TsNode[];

  /** The symbol's value declaration. */
  valueDeclaration: (symbol: TsSymbol) => TsNode | undefined;

  /** The type at a node. */
  typeAt: (node: TsNode) => TsType;

  /** The type of a symbol. */
  typeOfSymbol: (symbol: TsSymbol) => TsType;

  /** The properties of a type. */
  properties: (type: TsType) => readonly TsSymbol[];

  /** Whether the type carries a `TypeFlags` flag (`Null`, `String`, `BooleanLiteral`, ...). */
  typeHas: (type: TsType, flag: string) => boolean;

  /** The alias a type was written through, with its type arguments. */
  typeAlias: (
    type: TsType,
  ) => { readonly symbol: TsSymbol; readonly args: readonly TsType[] } | undefined;

  /** The members of a union type; undefined for any other type. */
  unionMembers: (type: TsType) => readonly TsType[] | undefined;

  /** The value of a literal type. */
  literal: (type: TsType) => string | number | boolean | undefined;

  /** The symbol of a type. */
  typeSymbol: (type: TsType) => TsSymbol | undefined;

  /** The type printed by the checker. */
  typeText: (type: TsType) => string;

  /** Releases the program (stops the tsgo process). */
  close: () => void;
}
