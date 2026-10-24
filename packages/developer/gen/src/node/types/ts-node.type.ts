/**
 * Stackra file contract:
 * Purpose: `TsNode`, the syntax node gen's discovery reads through the host seam: the property names TypeScript 6 and
 *          TypeScript 7 share for the nodes gen inspects (classes, heritage, decorators, literals, type nodes,
 *          imports and exports). Kinds and flags are never compared by number here; the host names them.
 * Boundary: a type only. Both backends hand out their own node objects; the host casts them to this shape once. The
 *           one property the backends name differently (the `?` of an optional member) is read by
 *           `TsHost.isOptional`, never from here.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 26: one host seam, no ts-morph); ADR 0305 (rule 42); the STA-335
 *                     type-to-schema spike (TS 6 and 7 share node property names).
 */

/** One syntax node, as both TypeScript backends shape it. */
export interface TsNode {
  /** The backend's `SyntaxKind` number; compare through `TsHost.kind`. */
  readonly kind: number;

  /** The full start, leading trivia included. */
  readonly pos: number;

  /** The end offset. */
  readonly end: number;

  /** The source file's path, on a source file node. */
  readonly fileName?: string;

  /** The text of an identifier or a literal. */
  readonly text?: string;

  /** The top-level statements of a source file. */
  readonly statements?: readonly TsNode[];

  /** The declared name of a class, member, variable, property or import specifier. */
  readonly name?: TsNode;

  /** The `extends` and `implements` clauses of a class. */
  readonly heritageClauses?: readonly TsNode[];

  /** The keyword of a heritage clause (`extends`), as a kind number. */
  readonly token?: number;

  /** The types of a heritage clause or of a union type. */
  readonly types?: readonly TsNode[];

  /** The members of a class. */
  readonly members?: readonly TsNode[];

  /** Modifiers and decorators, in source order. */
  readonly modifiers?: readonly TsNode[];

  /** The expression of a decorator, call, property access, heritage type or parenthesized expression. */
  readonly expression?: TsNode;

  /** The arguments of a call. */
  readonly arguments?: readonly TsNode[];

  /** The type arguments of a call, a heritage type or a type reference. */
  readonly typeArguments?: readonly TsNode[];

  /** The initializer of a property, variable or property assignment. */
  readonly initializer?: TsNode;

  /** The declared type node of a property, parameter, variable or method return. */
  readonly type?: TsNode;

  /** The parameters of a method or constructor. */
  readonly parameters?: readonly TsNode[];

  /** The body of a method, constructor or function. */
  readonly body?: TsNode;

  /** The elements of an array literal. */
  readonly elements?: readonly TsNode[];

  /** The properties of an object literal or the members of a type literal. */
  readonly properties?: readonly TsNode[];

  /** The operand of a prefix unary expression. */
  readonly operand?: TsNode;

  /** The operator of a prefix unary expression, as a kind number. */
  readonly operator?: number;

  /** The literal of a literal type node. */
  readonly literal?: TsNode;

  /** The name of a type reference. */
  readonly typeName?: TsNode;

  /** The element type of an array type. */
  readonly elementType?: TsNode;

  /** The object type of an indexed access type (`Point["slot"]`). */
  readonly objectType?: TsNode;

  /** The index type of an indexed access type. */
  readonly indexType?: TsNode;

  /** The expression name of a type query (`typeof X.Case`). */
  readonly exprName?: TsNode;

  /** The left side of a qualified name. */
  readonly left?: TsNode;

  /** The right side of a qualified name. */
  readonly right?: TsNode;

  /** The module specifier of an import or export declaration. */
  readonly moduleSpecifier?: TsNode;

  /** The import clause of an import declaration. */
  readonly importClause?: TsNode;

  /** The named bindings of an import clause. */
  readonly namedBindings?: TsNode;

  /** The imported name of an aliased import specifier (`X` of `X as Y`). */
  readonly propertyName?: TsNode;

  /** The declaration list of a variable statement. */
  readonly declarationList?: TsNode;

  /** The declarations of a variable declaration list. */
  readonly declarations?: readonly TsNode[];

  /** Whether an import or export is `type`-only. */
  readonly isTypeOnly?: boolean;

  /** The export clause of an export declaration (`export { x } from`). */
  readonly exportClause?: TsNode;
}
