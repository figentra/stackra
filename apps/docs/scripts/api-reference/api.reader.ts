/**
 * Stackra file contract:
 * Purpose: `ApiReader`, the TypeScript compiler view of the packages' entry files: one program over every entry, read
 *          into `ApiSymbol`s (kind, declaration without bodies or comments, TSDoc, documented members, declaring file),
 *          so the API reference needs neither TypeDoc nor API Extractor.
 * Boundary: reads source files through the TS compiler; writes nothing. Private and `#private` class members and
 *           `@internal` symbols are left out; a name declared in another package is a `reexport` naming that package.
 * Runtime: node
 * Governing contract: ADR 0007 (docblock standard); ADR 0294 d26 (the TypeScript 6 JS API beside TypeScript 7);
 *                     STA-2857.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

// TypeScript 7 (native) ships no JS API yet; the 6.x alias does (as in @stackra/gen and the showcase).
import ts from "typescript6";

import type { ApiDoc } from "#scripts/api-reference/api-doc.type";
import type { ApiMember } from "#scripts/api-reference/api-member.type";
import type { ApiSymbolKind } from "#scripts/api-reference/api-symbol-kind.type";
import type { ApiSymbol } from "#scripts/api-reference/api-symbol.type";
import { EMPTY_DOC } from "#scripts/api-reference/empty-doc.constant";
import { parseDocComment } from "#scripts/api-reference/parse-doc-comment.function";

/**
 * One option set for every package: the shared `@stackra/typescript-config` base plus JSX and the DOM, so one program
 * (one parse and one checker) serves every entry. The reference prints declarations, it never reports diagnostics.
 */
const OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  customConditions: ["@stackra/source"],
  jsx: ts.JsxEmit.ReactJSX,
  experimentalDecorators: true,
  allowImportingTsExtensions: true,
  resolveJsonModule: true,
  strict: true,
  exactOptionalPropertyTypes: true,
  skipLibCheck: true,
  noEmit: true,
  lib: ["lib.es2023.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
  types: [],
};

/** Inferred types are written with TypeScript's own truncation, so a deep Zod or JSX type stays one line. */
const TYPE_FORMAT = ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;

/** Modifiers a printed declaration drops: the reference shows the shape, not how the file exports it. */
const DROPPED_MODIFIERS = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.ExportKeyword,
  ts.SyntaxKind.DefaultKeyword,
  ts.SyntaxKind.DeclareKeyword,
  ts.SyntaxKind.AsyncKeyword,
]);

/** The order a name declared several ways (a `const` and a `type` of the same name) takes its kind from. */
const KIND_ORDER: readonly ApiSymbolKind[] = [
  "class",
  "function",
  "enum",
  "variable",
  "interface",
  "type",
  "namespace",
];

/** The comment that opens every Stackra file; never the doc of the declaration after it. */
const FILE_CONTRACT = /^\/\*\*\s*\n?\s*\*?\s*Stackra file contract:/;

/** One printed declaration with what it contributes to its symbol. */
interface Part {
  readonly kind: ApiSymbolKind;
  readonly text: string;
  readonly doc: ApiDoc;
  readonly members: readonly ApiMember[];
}

/** Collapses a printed member onto one line. */
function oneLine(text: string): string {
  return text.replaceAll(/\s+/g, " ").trim();
}

/** Forward slashes on every platform, so the pages do not change with the machine that writes them. */
function posix(path: string): string {
  return path.split(sep).join("/");
}

/** The TS view of every entry file. */
export class ApiReader {
  private readonly program: ts.Program;

  private readonly checker: ts.TypeChecker;

  private readonly printer = ts.createPrinter({
    removeComments: true,
    newLine: ts.NewLineKind.LineFeed,
  });

  private readonly owners = new Map<string, string>();

  /** The file of the declaration being printed: the printer reads original identifiers' text from it. */
  private source: ts.SourceFile | undefined;

  // no parameter properties: node's type stripping runs this file as is
  constructor(files: readonly string[]) {
    this.program = ts.createProgram(files, OPTIONS);
    this.checker = this.program.getTypeChecker();
  }

  /**
   * The exported symbols of one entry file, sorted by name.
   *
   * @param file - the entry file (absolute), one of the files the reader was built with.
   * @param packageDir - the package folder (absolute); a name declared outside it is a `reexport`.
   * @returns one `ApiSymbol` per exported name the reference documents.
   * @throws Error when the file is not part of the program.
   * @example
   * new ApiReader([entry]).read(entry, packageDir).map((symbol) => symbol.name);
   */
  read(file: string, packageDir: string): ApiSymbol[] {
    const source = this.program.getSourceFile(file);
    if (source === undefined) throw new Error(`api-reference: ${file} is not in the program`);
    const module = this.checker.getSymbolAtLocation(source);
    if (module === undefined) return [];
    const symbols: ApiSymbol[] = [];
    for (const exported of this.checker.getExportsOfModule(module)) {
      const symbol = this.symbol(exported, packageDir);
      if (symbol !== undefined) symbols.push(symbol);
    }
    return symbols.toSorted((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  }

  /** One exported name, or undefined when it is `@internal` or has no declaration. */
  private symbol(exported: ts.Symbol, packageDir: string): ApiSymbol | undefined {
    const name = exported.getName();
    const target =
      exported.flags & ts.SymbolFlags.Alias ? this.checker.getAliasedSymbol(exported) : exported;
    const declarations = target.getDeclarations() ?? [];
    const first = declarations[0];
    if (first === undefined) return undefined;
    const declaringFile = first.getSourceFile().fileName;
    if (!ts.isSourceFile(first) && !declaringFile.startsWith(packageDir + "/")) {
      const doc = this.docOf(first);
      if (doc.internal) return undefined;
      return {
        name,
        kind: "reexport",
        signature: "",
        doc,
        members: [],
        file: "",
        from: this.ownerOf(declaringFile),
      };
    }
    const parts = declarations.flatMap((declaration) => this.parts(declaration, name));
    if (parts.length === 0) return undefined;
    const doc = parts.find((part) => part.doc.summary !== "")?.doc ?? parts[0]?.doc ?? EMPTY_DOC;
    if (doc.internal) return undefined;
    const kind =
      KIND_ORDER.find((candidate) => parts.some((part) => part.kind === candidate)) ?? "variable";
    return {
      name,
      kind,
      signature: parts.map((part) => part.text).join("\n\n"),
      doc,
      members: parts.flatMap((part) => part.members),
      file: posix(relative(packageDir, ts.isSourceFile(first) ? first.fileName : declaringFile)),
    };
  }

  /** The printed parts of one declaration of a symbol. */
  private parts(declaration: ts.Declaration, name: string): Part[] {
    this.source = declaration.getSourceFile();
    const id = ts.factory.createIdentifier(name);
    if (ts.isFunctionDeclaration(declaration)) {
      // an implementation after overloads is not part of the API; a lone implementation is
      const overloaded = declaration.body !== undefined && this.hasOverloads(declaration);
      if (overloaded) return [];
      const clone = ts.factory.updateFunctionDeclaration(
        declaration,
        this.modifiers(declaration.modifiers),
        undefined,
        id,
        declaration.typeParameters,
        declaration.parameters.map((parameter) => this.parameter(parameter)),
        declaration.type ?? this.returnType(declaration),
        undefined,
      );
      return [
        { kind: "function", text: this.print(clone), doc: this.docOf(declaration), members: [] },
      ];
    }
    if (ts.isClassDeclaration(declaration)) return [this.classPart(declaration, id)];
    if (ts.isInterfaceDeclaration(declaration)) {
      const clone = ts.factory.updateInterfaceDeclaration(
        declaration,
        [],
        id,
        declaration.typeParameters,
        declaration.heritageClauses,
        declaration.members,
      );
      return [
        {
          kind: "interface",
          text: this.print(clone),
          doc: this.docOf(declaration),
          members: this.typeMembers(declaration.members),
        },
      ];
    }
    if (ts.isTypeAliasDeclaration(declaration)) {
      const clone = ts.factory.updateTypeAliasDeclaration(
        declaration,
        [],
        id,
        declaration.typeParameters,
        declaration.type,
      );
      const members = ts.isTypeLiteralNode(declaration.type)
        ? this.typeMembers(declaration.type.members)
        : [];
      return [{ kind: "type", text: this.print(clone), doc: this.docOf(declaration), members }];
    }
    if (ts.isEnumDeclaration(declaration)) {
      const clone = ts.factory.updateEnumDeclaration(
        declaration,
        this.modifiers(declaration.modifiers),
        id,
        declaration.members,
      );
      const members: ApiMember[] = declaration.members.map((member) => ({
        name: member.name.getText(),
        kind: "enum-member",
        signature: oneLine(this.print(member)),
        isStatic: false,
        doc: this.docOf(member),
      }));
      return [{ kind: "enum", text: this.print(clone), doc: this.docOf(declaration), members }];
    }
    if (ts.isVariableDeclaration(declaration)) return [this.variablePart(declaration, name)];
    if (ts.isModuleDeclaration(declaration) || ts.isSourceFile(declaration)) {
      return [this.namespacePart(declaration, name)];
    }
    if (ts.isExportAssignment(declaration)) {
      const type = this.checker.getTypeAtLocation(declaration.expression);
      return [
        {
          kind: "variable",
          text: `const ${name}: ${this.checker.typeToString(type, declaration, TYPE_FORMAT)};`,
          doc: this.docOf(declaration),
          members: [],
        },
      ];
    }
    return [];
  }

  /** True when another declaration of the same function is a body-less overload. */
  private hasOverloads(declaration: ts.FunctionDeclaration): boolean {
    const symbol =
      declaration.name === undefined
        ? undefined
        : this.checker.getSymbolAtLocation(declaration.name);
    return (symbol?.getDeclarations() ?? []).some(
      (other) =>
        other !== declaration && ts.isFunctionDeclaration(other) && other.body === undefined,
    );
  }

  /** A class with its public and protected members, bodies and initializers removed. */
  private classPart(declaration: ts.ClassDeclaration, id: ts.Identifier): Part {
    const kept: ts.ClassElement[] = [];
    const members: ApiMember[] = [];
    for (const member of declaration.members) {
      const clone = this.classMember(member);
      if (clone === undefined) continue;
      kept.push(clone);
      const doc = this.docOf(member);
      if (doc.internal) continue;
      members.push({
        name: ts.isConstructorDeclaration(member)
          ? "constructor"
          : (member.name?.getText() ?? "[index]"),
        kind: ts.isConstructorDeclaration(member)
          ? "constructor"
          : ts.isMethodDeclaration(member)
            ? "method"
            : ts.isGetAccessorDeclaration(member) || ts.isSetAccessorDeclaration(member)
              ? "accessor"
              : ts.isIndexSignatureDeclaration(member)
                ? "index"
                : "property",
        signature: oneLine(this.print(clone)),
        isStatic: (ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static) !== 0,
        doc,
      });
    }
    const clone = ts.factory.updateClassDeclaration(
      declaration,
      this.modifiers(declaration.modifiers),
      id,
      declaration.typeParameters,
      declaration.heritageClauses,
      kept,
    );
    return { kind: "class", text: this.print(clone), doc: this.docOf(declaration), members };
  }

  /** One class member without its body or initializer, or undefined when the API leaves it out. */
  private classMember(member: ts.ClassElement): ts.ClassElement | undefined {
    if (member.name !== undefined && ts.isPrivateIdentifier(member.name)) return undefined;
    const flags = ts.getCombinedModifierFlags(member);
    if (flags & ts.ModifierFlags.Private) return undefined;
    if (this.docOf(member).internal) return undefined;
    const modifiers = this.modifiers(
      ts.canHaveModifiers(member) ? ts.getModifiers(member) : undefined,
    );
    if (ts.isConstructorDeclaration(member)) {
      return ts.factory.updateConstructorDeclaration(
        member,
        modifiers,
        member.parameters.map((parameter) => this.parameter(parameter)),
        undefined,
      );
    }
    if (ts.isMethodDeclaration(member)) {
      if (member.body !== undefined && this.methodHasOverloads(member)) return undefined;
      return ts.factory.updateMethodDeclaration(
        member,
        modifiers,
        undefined,
        member.name,
        member.questionToken,
        member.typeParameters,
        member.parameters.map((parameter) => this.parameter(parameter)),
        member.type ?? this.returnType(member),
        undefined,
      );
    }
    if (ts.isPropertyDeclaration(member)) {
      return ts.factory.updatePropertyDeclaration(
        member,
        modifiers,
        member.name,
        member.questionToken,
        member.type ?? this.typeNode(this.checker.getTypeAtLocation(member), member),
        undefined,
      );
    }
    if (ts.isGetAccessorDeclaration(member)) {
      return ts.factory.updateGetAccessorDeclaration(
        member,
        modifiers,
        member.name,
        [],
        member.type ?? this.returnType(member),
        undefined,
      );
    }
    if (ts.isSetAccessorDeclaration(member)) {
      return ts.factory.updateSetAccessorDeclaration(
        member,
        modifiers,
        member.name,
        member.parameters.map((parameter) => this.parameter(parameter)),
        undefined,
      );
    }
    if (ts.isIndexSignatureDeclaration(member)) return member;
    return undefined;
  }

  /** True when the method is an implementation after body-less overloads. */
  private methodHasOverloads(member: ts.MethodDeclaration): boolean {
    const symbol = this.checker.getSymbolAtLocation(member.name);
    return (symbol?.getDeclarations() ?? []).some(
      (other) => other !== member && ts.isMethodDeclaration(other) && other.body === undefined,
    );
  }

  /** The member rows of an interface or object type. */
  private typeMembers(elements: ts.NodeArray<ts.TypeElement>): ApiMember[] {
    const members: ApiMember[] = [];
    for (const element of elements) {
      const doc = this.docOf(element);
      if (doc.internal) continue;
      const kind: ApiMember["kind"] = ts.isMethodSignature(element)
        ? "method"
        : ts.isCallSignatureDeclaration(element)
          ? "call"
          : ts.isConstructSignatureDeclaration(element)
            ? "constructor"
            : ts.isIndexSignatureDeclaration(element)
              ? "index"
              : ts.isGetAccessorDeclaration(element) || ts.isSetAccessorDeclaration(element)
                ? "accessor"
                : "property";
      const name =
        element.name?.getText() ??
        (kind === "call" ? "(call)" : kind === "constructor" ? "new" : "[index]");
      members.push({ name, kind, signature: oneLine(this.print(element)), isStatic: false, doc });
    }
    return members;
  }

  /** A `const`/`let` with its annotated or inferred type; an object literal's keys become members. */
  private variablePart(declaration: ts.VariableDeclaration, name: string): Part {
    const list = declaration.parent;
    const keyword =
      ts.isVariableDeclarationList(list) && list.flags & ts.NodeFlags.Const ? "const" : "let";
    const type =
      declaration.type === undefined
        ? this.checker.typeToString(
            this.checker.getTypeAtLocation(declaration),
            declaration,
            TYPE_FORMAT,
          )
        : this.print(declaration.type);
    let initializer = declaration.initializer;
    while (
      initializer !== undefined &&
      (ts.isAsExpression(initializer) ||
        ts.isSatisfiesExpression(initializer) ||
        ts.isParenthesizedExpression(initializer))
    ) {
      initializer = initializer.expression;
    }
    const members: ApiMember[] = [];
    if (initializer !== undefined && ts.isObjectLiteralExpression(initializer)) {
      for (const property of initializer.properties) {
        if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property))
          continue;
        const doc = this.docOf(property);
        if (doc.internal) continue;
        const value = this.checker.typeToString(
          this.checker.getTypeAtLocation(property),
          property,
          TYPE_FORMAT,
        );
        members.push({
          name: property.name.getText(),
          kind: "property",
          signature: oneLine(`${property.name.getText()}: ${value}`),
          isStatic: false,
          doc,
        });
      }
    }
    return {
      kind: "variable",
      text: `${keyword} ${name}: ${type};`,
      doc: this.docOf(declaration),
      members,
    };
  }

  /** A namespace (`export * as name` or `namespace name`): its exported names as members. */
  private namespacePart(declaration: ts.ModuleDeclaration | ts.SourceFile, name: string): Part {
    const symbol = ts.isSourceFile(declaration)
      ? this.checker.getSymbolAtLocation(declaration)
      : this.checker.getSymbolAtLocation(declaration.name);
    const members: ApiMember[] = [];
    for (const exported of symbol === undefined ? [] : this.checker.getExportsOfModule(symbol)) {
      const target =
        exported.flags & ts.SymbolFlags.Alias ? this.checker.getAliasedSymbol(exported) : exported;
      const first = target.getDeclarations()?.[0];
      const doc = first === undefined ? EMPTY_DOC : this.docOf(first);
      if (doc.internal) continue;
      members.push({
        name: exported.getName(),
        kind: "property",
        signature: exported.getName(),
        isStatic: false,
        doc,
      });
    }
    members.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    return {
      kind: "namespace",
      text: `namespace ${name} { /* ${members.length} exports */ }`,
      doc: ts.isSourceFile(declaration) ? EMPTY_DOC : this.docOf(declaration),
      members,
    };
  }

  /** A parameter as a declaration file writes it: no initializer (an optional mark instead), no decorators. */
  private parameter(parameter: ts.ParameterDeclaration): ts.ParameterDeclaration {
    const optional =
      parameter.questionToken ??
      (parameter.initializer !== undefined && parameter.dotDotDotToken === undefined
        ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
        : undefined);
    return ts.factory.updateParameterDeclaration(
      parameter,
      this.modifiers(ts.getModifiers(parameter)),
      parameter.dotDotDotToken,
      parameter.name,
      optional,
      parameter.type ?? this.typeNode(this.checker.getTypeAtLocation(parameter), parameter),
      undefined,
    );
  }

  /** The inferred return type of a function, method or getter. */
  private returnType(declaration: ts.SignatureDeclaration): ts.TypeNode | undefined {
    const signature = this.checker.getSignatureFromDeclaration(declaration);
    return signature === undefined
      ? undefined
      : this.typeNode(this.checker.getReturnTypeOfSignature(signature), declaration);
  }

  /** A type as a node that prints as TypeScript writes it in a message. */
  private typeNode(type: ts.Type, enclosing: ts.Node): ts.TypeNode {
    return ts.factory.createTypeReferenceNode(
      this.checker.typeToString(type, enclosing, TYPE_FORMAT),
    );
  }

  /** Modifiers without decorators and without the ones the reference drops. */
  private modifiers(modifiers: readonly ts.ModifierLike[] | undefined): ts.Modifier[] {
    return (modifiers ?? []).filter(
      (modifier): modifier is ts.Modifier =>
        ts.isModifier(modifier) && !DROPPED_MODIFIERS.has(modifier.kind),
    );
  }

  /** A node printed without comments. */
  private print(node: ts.Node): string {
    if (this.source === undefined) throw new Error("api-reference: print outside a declaration");
    return this.printer.printNode(ts.EmitHint.Unspecified, node, this.source);
  }

  /** The TSDoc of a declaration: its last `/** *\/` comment that is not a file contract. */
  private docOf(node: ts.Node): ApiDoc {
    const comments = ts
      .getJSDocCommentsAndTags(node)
      .filter(
        (comment): comment is ts.JSDoc =>
          ts.isJSDoc(comment) && !FILE_CONTRACT.test(comment.getText()),
      );
    const last = comments.at(-1);
    return last === undefined ? EMPTY_DOC : parseDocComment(last.getText());
  }

  /** The name of the package that holds `file`: the nearest `package.json` with a name. */
  private ownerOf(file: string): string {
    let dir = dirname(file);
    const visited: string[] = [];
    while (dir !== dirname(dir)) {
      const known = this.owners.get(dir);
      if (known !== undefined) return this.remember(visited, known);
      visited.push(dir);
      const manifest = join(dir, "package.json");
      if (existsSync(manifest)) {
        const name = (JSON.parse(readFileSync(manifest, "utf8")) as { name?: unknown }).name;
        if (typeof name === "string") return this.remember(visited, name);
      }
      dir = dirname(dir);
    }
    return this.remember(visited, "typescript");
  }

  /** Caches the owner of each folder walked. */
  private remember(dirs: readonly string[], owner: string): string {
    for (const dir of dirs) this.owners.set(dir, owner);
    return owner;
  }
}
