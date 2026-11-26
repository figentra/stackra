/**
 * Stackra file contract:
 * Purpose: `emittedCodes(dir, shape)`, the codes a tool can print, read from its TypeScript source: every string
 *          literal that reaches the `code` (or `rule`) of a finding object, followed through local helpers
 *          (`refuse("x", …)`), exported helpers called from other files (`undeclaredPackages(ir, files, "x")`),
 *          conditionals and `for (const [code] of [["x", …]])` lists. The error-code reference test compares them with
 *          `customers/error-codes`.
 * Boundary: reads the source through `sourceFiles`; never type-checks or runs it. A helper's calls are read in its own
 *           file, and in the files that import it when it is exported, so a same-named local helper elsewhere is not
 *           mistaken for it. A code it cannot follow to a literal is returned in `unresolved` (file and expression),
 *           so the caller fails on it instead of missing it.
 * Runtime: node
 * Governing contract: ADR 0231 (snake_case machine codes); ADR 0294 (decision 22: a refusal names its code and fix);
 *                     ADR 0282 (decision 3: `stackra check`); ADR 0296 (runway enforcement); STA-2853.
 */
import ts from "typescript6";

import type { CodeScan } from "#scripts/error-codes/code-scan";
import type { FindingShape } from "#scripts/error-codes/finding-shape";
import { sourceFiles } from "#scripts/error-codes/source-files";

/** How many helper hops a code is followed through before it counts as unresolved. */
const MAX_DEPTH = 6;

/** The string literals an expression can evaluate to, or `undefined` when it is not made of literals only. */
function literalsOf(expression: ts.Expression | undefined): string[] | undefined {
  if (expression === undefined) return undefined;
  if (ts.isStringLiteralLike(expression)) return [expression.text];
  if (
    ts.isParenthesizedExpression(expression) ||
    ts.isAsExpression(expression) ||
    ts.isSatisfiesExpression(expression)
  )
    return literalsOf(expression.expression);
  if (ts.isConditionalExpression(expression)) {
    const whenTrue = literalsOf(expression.whenTrue);
    const whenFalse = literalsOf(expression.whenFalse);
    return whenTrue && whenFalse ? [...whenTrue, ...whenFalse] : undefined;
  }
  return undefined;
}

/** The name a function-like node is called by: its declaration name, or the variable it is assigned to. */
function calledName(node: ts.SignatureDeclaration): string | undefined {
  if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) && node.name)
    return ts.isIdentifier(node.name) ? node.name.text : undefined;
  const parent = node.parent;
  if (parent !== undefined && ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name))
    return parent.name.text;
  return undefined;
}

/** The innermost function-like node around `node`. */
function enclosingFunction(node: ts.Node): ts.SignatureDeclaration | undefined {
  let current: ts.Node | undefined = node.parent;
  while (current !== undefined && !ts.isFunctionLike(current)) current = current.parent;
  return current;
}

/** The name of an object literal member, when it is a plain identifier or string. */
function keyOf(member: ts.ObjectLiteralElementLike): string | undefined {
  const name = member.name;
  if (name === undefined) return undefined;
  return ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : undefined;
}

/** The name a call is made by: `name(…)` or `object.name(…)`. */
function calleeName(call: ts.CallExpression): string | undefined {
  const callee = call.expression;
  if (ts.isIdentifier(callee)) return callee.text;
  return ts.isPropertyAccessExpression(callee) ? callee.name.text : undefined;
}

/** Whether a function, or the variable statement that holds it, is exported. */
function isExported(fn: ts.SignatureDeclaration): boolean {
  const holder = ts.isFunctionDeclaration(fn) ? fn : fn.parent?.parent?.parent;
  return (
    holder !== undefined &&
    ts.canHaveModifiers(holder) &&
    (ts.getModifiers(holder) ?? []).some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    )
  );
}

/** Whether `file` imports a binding called `name`. */
function imports(file: ts.SourceFile, name: string): boolean {
  return file.statements.some(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      statement.importClause?.namedBindings !== undefined &&
      ts.isNamedImports(statement.importClause.namedBindings) &&
      statement.importClause.namedBindings.elements.some((element) => element.name.text === name),
  );
}

/** Strips `as` casts and parentheses. */
function bare(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (ts.isAsExpression(current) || ts.isParenthesizedExpression(current))
    current = current.expression;
  return current;
}

/**
 * The codes the source under `dir` puts in findings of `shape`.
 *
 * @param dir - the source folder of one tool, such as `packages/developer/gen/src`.
 * @param shape - the code property and its sibling keys.
 * @returns every code with its files, and what could not be followed to a literal.
 * @example
 * emittedCodes("packages/developer/gen/src", { property: "code", siblings: ["fix"] }).codes.has("append_only_not_revoked"); // true
 */
export function emittedCodes(dir: string, shape: FindingShape): CodeScan {
  const files = sourceFiles(dir);
  const codes = new Map<string, Set<string>>();
  const unresolved = new Set<string>();

  const add = (code: string, path: string): void => {
    const owners = codes.get(code) ?? new Set<string>();
    owners.add(path);
    codes.set(code, owners);
  };

  /** The literals `expression` can carry as a code, followed through identifiers. */
  const resolve = (
    expression: ts.Expression | undefined,
    path: string,
    depth: number,
  ): string[] => {
    const literals = literalsOf(expression);
    if (literals !== undefined) return literals;
    if (expression !== undefined && ts.isIdentifier(expression) && depth <= MAX_DEPTH)
      return identifierLiterals(expression, path, depth);
    unresolved.add(`${path}: ${expression?.getText() ?? "(no argument)"}`);
    return [];
  };

  /**
   * The literals passed as argument `index` of every call of `name`: in its own file, and, when it is exported, in the
   * files that import it by that name (a same-named local helper elsewhere is another function).
   */
  const argumentsOf = (
    fn: ts.SignatureDeclaration,
    name: string,
    index: number,
    depth: number,
  ): string[] => {
    const home = fn.getSourceFile();
    const callers = files.filter(
      ({ file }) => file === home || (isExported(fn) && imports(file, name)),
    );
    const found: string[] = [];
    for (const { path, file } of callers) {
      const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node) && calleeName(node) === name)
          found.push(...resolve(node.arguments[index], path, depth + 1));
        ts.forEachChild(node, visit);
      };
      visit(file);
    }
    return found;
  };

  /** The literals of the entries at `position` of a `for (const [a, b] of [[…], …])` list. */
  const listLiterals = (
    loop: ts.ForOfStatement,
    position: number,
    path: string,
    depth: number,
  ): string[] => {
    const list = bare(loop.expression);
    if (!ts.isArrayLiteralExpression(list)) {
      unresolved.add(`${path}: for (… of ${list.getText()})`);
      return [];
    }
    return list.elements.flatMap((entry) => {
      const row = bare(entry);
      if (ts.isArrayLiteralExpression(row)) return resolve(row.elements[position], path, depth + 1);
      unresolved.add(`${path}: ${entry.getText()}`);
      return [];
    });
  };

  /** The literals an identifier holds: a parameter of a called helper, a local constant, or a `for … of` entry. */
  const identifierLiterals = (identifier: ts.Identifier, path: string, depth: number): string[] => {
    for (let fn = enclosingFunction(identifier); fn !== undefined; fn = enclosingFunction(fn)) {
      const index = fn.parameters.findIndex(
        (parameter) => ts.isIdentifier(parameter.name) && parameter.name.text === identifier.text,
      );
      if (index < 0) continue;
      const name = calledName(fn);
      if (name !== undefined) return argumentsOf(fn, name, index, depth);
      break;
    }
    const found: string[] = [];
    let declared = false;
    const visit = (node: ts.Node): void => {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === identifier.text &&
        node.initializer !== undefined
      ) {
        declared = true;
        found.push(...resolve(node.initializer, path, depth + 1));
      }
      if (ts.isForOfStatement(node) && ts.isVariableDeclarationList(node.initializer)) {
        const binding = node.initializer.declarations[0]?.name;
        if (binding !== undefined && ts.isArrayBindingPattern(binding)) {
          const position = binding.elements.findIndex(
            (element) =>
              ts.isBindingElement(element) &&
              ts.isIdentifier(element.name) &&
              element.name.text === identifier.text,
          );
          if (position >= 0) {
            declared = true;
            found.push(...listLiterals(node, position, path, depth));
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(identifier.getSourceFile());
    if (!declared) unresolved.add(`${path}: ${identifier.text}`);
    return found;
  };

  for (const { path, file } of files) {
    const visit = (node: ts.Node): void => {
      if (ts.isObjectLiteralExpression(node)) {
        const keys = new Set(node.properties.map(keyOf));
        const member = node.properties.find((entry) => keyOf(entry) === shape.property);
        if (member !== undefined && shape.siblings.some((sibling) => keys.has(sibling))) {
          const value = ts.isShorthandPropertyAssignment(member)
            ? member.name
            : ts.isPropertyAssignment(member)
              ? member.initializer
              : undefined;
          for (const code of resolve(value, path, 0)) add(code, path);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
  }

  return {
    codes: new Map(
      [...codes]
        .toSorted(([a], [b]) => a.localeCompare(b))
        .map(([code, owners]) => [code, [...owners].toSorted()]),
    ),
    unresolved: [...unresolved].toSorted(),
  };
}
