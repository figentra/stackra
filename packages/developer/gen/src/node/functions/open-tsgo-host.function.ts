/**
 * Stackra file contract:
 * Purpose: `openTsgoHost`, the TypeScript 7 host: `typescript/unstable/sync` (a JSON-RPC client over the tsgo binary
 *          that typescript 7.0.2 installs) opened on a member's tsconfig, answering the `TsHost` questions.
 * Boundary: the only file that touches the unstable TypeScript 7 API; its objects are cast to local shapes once, so
 *           an API change breaks here and nowhere else. Declarations come back as handles resolved against the
 *           project. `close()` stops the tsgo process.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 26: the TypeScript 7 API behind a seam); ADR 0305 (rule 42); the STA-335
 *                     type-to-schema spike (the `tsgoHost` it measured).
 */
import { dirname, resolve } from "node:path";

import { kindNames } from "#node/functions/kind-names.function";
import type { TsHost } from "#node/types/ts-host.type";
import type { TsSymbol } from "#node/types/ts-symbol.type";
import type { TsType } from "#node/types/ts-type.type";
import type { TsNode } from "#node/types/ts-node.type";

/** A tsgo node: the shared shape plus the methods gen calls. */
interface GoNode extends TsNode {
  getSourceFile(): GoNode & {
    readonly text: string;
    getLineAndCharacterOfPosition(at: number): { line: number; character: number };
  };
  getStart(file?: GoNode): number;
  getText(file?: GoNode): string;
  readonly postfixToken?: TsNode;
}

/** A declaration handle, resolved against a project. */
interface GoHandle {
  resolve(project: GoProject): GoNode | undefined;
}

/** A tsgo symbol. */
interface GoSymbol {
  readonly name: string;
  readonly flags: number;
  readonly declarations: readonly GoHandle[];
  readonly valueDeclaration?: GoHandle;
}

/** A tsgo type. */
interface GoType {
  readonly flags: number;
  readonly value?: string | number;
  readonly intrinsicName?: string;
  getAliasSymbol(): GoSymbol | undefined;
  getAliasTypeArguments(): readonly GoType[];
  getTypes(): readonly GoType[];
  getSymbol(): GoSymbol | undefined;
}

/** A tsgo project. */
interface GoProject {
  readonly program: {
    getSourceFileNames(): readonly string[];
    getSourceFile(name: string): GoNode | undefined;
  };
  readonly checker: {
    getSymbolAtLocation(node: GoNode): GoSymbol | undefined;
    getAliasedSymbol(symbol: GoSymbol): GoSymbol;
    getTypeAtLocation(node: GoNode): GoType;
    getTypeOfSymbol(symbol: GoSymbol): GoType;
    getPropertiesOfType(type: GoType): readonly GoSymbol[];
    typeToString(type: GoType): string;
  };
}

/** The parts of `typescript/unstable/sync` gen uses. */
interface GoSync {
  readonly API: new (options: { cwd: string }) => {
    updateSnapshot(params: { openProjects: readonly string[] }): {
      getProject(name: string): GoProject | undefined;
      getProjects(): readonly GoProject[];
    };
    close(): void;
  };
  readonly SymbolFlags: Readonly<Record<string, number>>;
  readonly TypeFlags: Readonly<Record<string, number>>;
}

/** The parts of `typescript/unstable/ast` gen uses. */
interface GoAst {
  readonly SyntaxKind: Readonly<Record<string, string | number>>;
}

/** The backend node behind a seam node. */
function go(node: TsNode): GoNode {
  return node as GoNode;
}

/** The backend symbol behind an opaque one. */
function symbol(value: TsSymbol): GoSymbol {
  return value as unknown as GoSymbol;
}

/** The backend type behind an opaque one. */
function type(value: TsType): GoType {
  return value as unknown as GoType;
}

/** A backend object handed out as an opaque seam value. */
function out<T>(value: unknown): T {
  return value as T;
}

/** A flag's bit, or 0 when the backend has no flag of that name. */
function flag(table: Readonly<Record<string, number>>, name: string): number {
  return table[name] ?? 0;
}

/**
 * Opens the TypeScript 7 program of `tsconfig`.
 *
 * @param tsconfig - the member's tsconfig.json.
 * @throws Error when the tsgo binary or the project cannot be opened; `openHost` then falls back to TypeScript 6.
 * @example
 * const host = await openTsgoHost("/repo/packages/commerce/loyalty-kit/tsconfig.json");
 */
export async function openTsgoHost(tsconfig: string): Promise<TsHost> {
  const sync = (await import("typescript/unstable/sync")) as unknown as GoSync;
  const ast = (await import("typescript/unstable/ast")) as unknown as GoAst;
  const config = resolve(tsconfig);
  const api = new sync.API({ cwd: dirname(config) });
  const snapshot = api.updateSnapshot({ openProjects: [config] });
  const project = snapshot.getProject(config) ?? snapshot.getProjects()[0];
  if (project === undefined) {
    api.close();
    throw new Error(`tsgo opened no project for ${config}`);
  }
  const { checker, program } = project;
  const kinds = kindNames(ast.SyntaxKind);
  const questionToken = ast.SyntaxKind["QuestionToken"];
  const deAlias = (found: GoSymbol | undefined): GoSymbol | undefined =>
    found !== undefined && (found.flags & flag(sync.SymbolFlags, "Alias")) !== 0
      ? checker.getAliasedSymbol(found)
      : found;

  return {
    name: "typescript 7 (tsgo)",
    files: () =>
      program
        .getSourceFileNames()
        .map((name) => program.getSourceFile(name))
        .filter((file): file is GoNode => file !== undefined),
    fileName: (node) => go(node).getSourceFile().fileName ?? "",
    kind: (node) => kinds.get(node.kind) ?? "Unknown",
    kindName: (kind) => kinds.get(kind) ?? "Unknown",
    text: (node) => go(node).getText(),
    leading: (node) => go(node).getSourceFile().text.slice(node.pos, go(node).getStart()),
    trailing: (node) => {
      const text = go(node).getSourceFile().text;
      const end = text.indexOf("\n", node.end);
      return text.slice(node.end, end === -1 ? undefined : end);
    },
    position: (node) => {
      const file = go(node).getSourceFile();
      const at = file.getLineAndCharacterOfPosition(go(node).getStart(file));
      return { line: at.line + 1, column: at.character + 1 };
    },
    isOptional: (node) => go(node).postfixToken?.kind === questionToken,
    symbolAt: (node) => out<TsSymbol | undefined>(deAlias(checker.getSymbolAtLocation(go(node)))),
    symbolName: (value) => symbol(value).name,
    symbolHas: (value, name) => (symbol(value).flags & flag(sync.SymbolFlags, name)) !== 0,
    declarations: (value) =>
      symbol(value)
        .declarations.map((handle) => handle.resolve(project))
        .filter((node): node is GoNode => node !== undefined),
    valueDeclaration: (value) => symbol(value).valueDeclaration?.resolve(project),
    typeAt: (node) => out<TsType>(checker.getTypeAtLocation(go(node))),
    typeOfSymbol: (value) => out<TsType>(checker.getTypeOfSymbol(symbol(value))),
    properties: (value) => out<readonly TsSymbol[]>([...checker.getPropertiesOfType(type(value))]),
    typeHas: (value, name) => (type(value).flags & flag(sync.TypeFlags, name)) !== 0,
    typeAlias: (value) => {
      const alias = type(value).getAliasSymbol();
      return alias === undefined
        ? undefined
        : {
            symbol: out<TsSymbol>(alias),
            args: out<readonly TsType[]>([...type(value).getAliasTypeArguments()]),
          };
    },
    unionMembers: (value) =>
      (type(value).flags & flag(sync.TypeFlags, "Union")) !== 0
        ? out<readonly TsType[]>([...type(value).getTypes()])
        : undefined,
    literal: (value) => {
      const raw = type(value);
      if ((raw.flags & flag(sync.TypeFlags, "BooleanLiteral")) !== 0)
        return raw.intrinsicName === "true";
      return (raw.flags & flag(sync.TypeFlags, "Literal")) !== 0 ? raw.value : undefined;
    },
    typeSymbol: (value) => out<TsSymbol | undefined>(type(value).getSymbol()),
    typeText: (value) => checker.typeToString(type(value)),
    close: () => api.close(),
  };
}
