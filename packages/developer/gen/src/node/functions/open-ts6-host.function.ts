/**
 * Stackra file contract:
 * Purpose: `openTs6Host`, the TypeScript 6 fallback host: the in-process compiler API of typescript 6.0.3 (installed
 *          under the alias `typescript6`) opened on a member's tsconfig, answering the `TsHost` questions with the
 *          same results as the TypeScript 7 host.
 * Boundary: the only file that touches the TypeScript 6 API; its objects are cast to local shapes once. Used when
 *           tsgo cannot start (no platform binary) or when a run asks for it (`backend: "ts6"`).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 26: a TypeScript 6 host as the fallback); ADR 0305 (rule 45); the STA-335
 *                     type-to-schema spike (byte-identical output on both backends).
 */
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

import { kindNames } from "#node/functions/kind-names.function";
import type { TsHost, TsSymbol, TsType } from "#node/types/ts-host.type";
import type { TsNode } from "#node/types/ts-node.type";

/** A TypeScript 6 node: the shared shape plus the methods gen calls. */
interface SixNode extends TsNode {
  getSourceFile(): SixNode & {
    readonly text: string;
    getLineAndCharacterOfPosition(at: number): { line: number; character: number };
  };
  getStart(file?: SixNode): number;
  getText(file?: SixNode): string;
  readonly questionToken?: TsNode;
}

/** A TypeScript 6 symbol. */
interface SixSymbol {
  readonly name: string;
  readonly flags: number;
  readonly declarations?: readonly SixNode[];
  readonly valueDeclaration?: SixNode;
}

/** A TypeScript 6 type. */
interface SixType {
  readonly flags: number;
  readonly value?: string | number;
  readonly intrinsicName?: string;
  readonly aliasSymbol?: SixSymbol;
  readonly aliasTypeArguments?: readonly SixType[];
  readonly types?: readonly SixType[];
  readonly symbol?: SixSymbol;
}

/** The parts of the typescript 6 module gen uses. */
interface SixModule {
  readonly version: string;
  readonly SyntaxKind: Readonly<Record<string, string | number>>;
  readonly SymbolFlags: Readonly<Record<string, number>>;
  readonly TypeFlags: Readonly<Record<string, number>>;
  readonly sys: { readFile(path: string): string | undefined };
  readConfigFile(
    path: string,
    read: (path: string) => string | undefined,
  ): { config?: unknown; error?: unknown };
  parseJsonConfigFileContent(
    json: unknown,
    host: unknown,
    base: string,
  ): { readonly fileNames: readonly string[]; readonly options: unknown };
  createProgram(setup: { rootNames: readonly string[]; options: unknown }): {
    getSourceFiles(): readonly SixNode[];
    getTypeChecker(): {
      getSymbolAtLocation(node: SixNode): SixSymbol | undefined;
      getAliasedSymbol(symbol: SixSymbol): SixSymbol;
      getTypeAtLocation(node: SixNode): SixType;
      getTypeOfSymbol(symbol: SixSymbol): SixType;
      getPropertiesOfType(type: SixType): readonly SixSymbol[];
      typeToString(type: SixType): string;
    };
  };
}

/** The backend node behind a seam node. */
function six(node: TsNode): SixNode {
  return node as SixNode;
}

/** The backend symbol behind an opaque one. */
function symbol(value: TsSymbol): SixSymbol {
  return value as unknown as SixSymbol;
}

/** The backend type behind an opaque one. */
function type(value: TsType): SixType {
  return value as unknown as SixType;
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
 * Opens the TypeScript 6 program of `tsconfig`.
 *
 * @param tsconfig - the member's tsconfig.json.
 * @throws Error when typescript6 is not installed or the tsconfig cannot be read.
 * @example
 * const host = openTs6Host("/repo/services/commerce/tsconfig.json");
 */
export function openTs6Host(tsconfig: string): TsHost {
  const ts = createRequire(import.meta.url)("typescript6") as SixModule;
  const config = resolve(tsconfig);
  const read = ts.readConfigFile(config, (path) => ts.sys.readFile(path));
  if (read.error !== undefined)
    throw new Error(`typescript ${ts.version} could not read ${config}`);
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, dirname(config));
  const program = ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options });
  const checker = program.getTypeChecker();
  const kinds = kindNames(ts.SyntaxKind);
  const deAlias = (found: SixSymbol | undefined): SixSymbol | undefined =>
    found !== undefined && (found.flags & flag(ts.SymbolFlags, "Alias")) !== 0
      ? checker.getAliasedSymbol(found)
      : found;

  return {
    name: `typescript ${ts.version}`,
    files: () => program.getSourceFiles(),
    fileName: (node) => six(node).getSourceFile().fileName ?? "",
    kind: (node) => kinds.get(node.kind) ?? "Unknown",
    kindName: (kind) => kinds.get(kind) ?? "Unknown",
    text: (node) => six(node).getText(),
    leading: (node) => six(node).getSourceFile().text.slice(node.pos, six(node).getStart()),
    trailing: (node) => {
      const text = six(node).getSourceFile().text;
      const end = text.indexOf("\n", node.end);
      return text.slice(node.end, end === -1 ? undefined : end);
    },
    position: (node) => {
      const file = six(node).getSourceFile();
      const at = file.getLineAndCharacterOfPosition(six(node).getStart(file));
      return { line: at.line + 1, column: at.character + 1 };
    },
    isOptional: (node) => six(node).questionToken !== undefined,
    symbolAt: (node) => out<TsSymbol | undefined>(deAlias(checker.getSymbolAtLocation(six(node)))),
    symbolName: (value) => symbol(value).name,
    symbolHas: (value, name) => (symbol(value).flags & flag(ts.SymbolFlags, name)) !== 0,
    declarations: (value) => symbol(value).declarations ?? [],
    valueDeclaration: (value) => symbol(value).valueDeclaration,
    typeAt: (node) => out<TsType>(checker.getTypeAtLocation(six(node))),
    typeOfSymbol: (value) => out<TsType>(checker.getTypeOfSymbol(symbol(value))),
    properties: (value) => out<readonly TsSymbol[]>(checker.getPropertiesOfType(type(value))),
    typeHas: (value, name) => (type(value).flags & flag(ts.TypeFlags, name)) !== 0,
    typeAlias: (value) => {
      const raw = type(value);
      return raw.aliasSymbol === undefined
        ? undefined
        : {
            symbol: out<TsSymbol>(raw.aliasSymbol),
            args: out<readonly TsType[]>(raw.aliasTypeArguments ?? []),
          };
    },
    unionMembers: (value) =>
      (type(value).flags & flag(ts.TypeFlags, "Union")) !== 0
        ? out<readonly TsType[]>(type(value).types ?? [])
        : undefined,
    literal: (value) => {
      const raw = type(value);
      if ((raw.flags & flag(ts.TypeFlags, "BooleanLiteral")) !== 0)
        return raw.intrinsicName === "true";
      return (raw.flags & flag(ts.TypeFlags, "Literal")) !== 0 ? raw.value : undefined;
    },
    typeSymbol: (value) => out<TsSymbol | undefined>(type(value).symbol),
    typeText: (value) => checker.typeToString(type(value)),
    close: () => undefined,
  };
}
