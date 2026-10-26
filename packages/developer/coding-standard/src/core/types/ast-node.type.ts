/**
 * Stackra file contract:
 * Purpose: the subset of the oxlint ESTree (TS-ESTree) node shape that the house rules read. oxlint does not export
 *          its node types, so the rules type nodes against this one structural interface.
 * Boundary: a structural type; every field is optional except the span, because a field exists only on the node
 *           types that carry it. No runtime code.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (the house rules ship as an oxlint jsPlugin); ADR 0305 (one declaration per file).
 */
import type { SourceLocation } from "#core/types/source-location.type";

/** A syntax tree node, as oxlint hands it to a rule visitor. */
export interface AstNode {
  /** The ESTree node type, such as `ClassDeclaration`. */
  readonly type: string;

  /** Start and end offsets in the source text. */
  readonly range: readonly [number, number];

  /** Start and end line and column. */
  readonly loc: SourceLocation;

  /** The enclosing node; `null` on the program. */
  readonly parent?: AstNode | null;

  /** An identifier's name. */
  readonly name?: string;

  /** A declaration's name. */
  readonly id?: AstNode | null;

  /** A class member's or property's key. */
  readonly key?: AstNode;

  /** A literal's value, or a class member's value node. */
  readonly value?: unknown;

  /** A method's kind (`constructor`, `method`, `get`, `set`) or a declaration's kind. */
  readonly kind?: string;

  /** Whether a class member is static. */
  readonly static?: boolean;

  /** Whether a class field is readonly. */
  readonly readonly?: boolean;

  /** A class member's TypeScript accessibility keyword. */
  readonly accessibility?: string | null;

  /** A program's statements, a class's body node or a class body's members. */
  readonly body?: AstNode | readonly AstNode[] | null;

  /** The decorators on a class, member or parameter. */
  readonly decorators?: readonly AstNode[];

  /** A decorator's or wrapper's inner expression. */
  readonly expression?: AstNode;

  /** A call's callee. */
  readonly callee?: AstNode;

  /** A call's arguments. */
  readonly arguments?: readonly AstNode[];

  /** An array literal's elements. */
  readonly elements?: readonly (AstNode | null)[];

  /** An object literal's properties. */
  readonly properties?: readonly AstNode[];

  /** A member expression's object. */
  readonly object?: AstNode;

  /** A member expression's property. */
  readonly property?: AstNode;

  /** A class's `extends` expression. */
  readonly superClass?: AstNode | null;

  /** The declaration an export wraps. */
  readonly declaration?: AstNode | null;

  /** A variable declaration's declarators. */
  readonly declarations?: readonly AstNode[];

  /** A variable declarator's initializer. */
  readonly init?: AstNode | null;

  /** An import's or export's specifiers. */
  readonly specifiers?: readonly AstNode[];

  /** An import's or re-export's module specifier. */
  readonly source?: AstNode | null;

  /** A specifier's local name. */
  readonly local?: AstNode;

  /** A function's or function type's parameters. */
  readonly params?: readonly AstNode[];

  /** An assignment pattern's target. */
  readonly left?: AstNode;

  /** A rest element's or spread's argument. */
  readonly argument?: AstNode;

  /** Whether a member's or property's key is computed (`[key]`). */
  readonly computed?: boolean;
}
