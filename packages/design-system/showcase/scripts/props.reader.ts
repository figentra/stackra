/**
 * Stackra file contract:
 * Purpose: `PropsReader`, the TypeScript compiler view of one package (@stackra/ui): a program over
 *          its props files with its own tsconfig, read into ApiProp rows (type, default, required, JSDoc, source,
 *          deprecation), the HeroUI names the type refuses, and native `classNames` slots.
 * Boundary: reads source and declaration files through the TS compiler; writes nothing.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2 steps 1 to 3.
 */
import { join } from "node:path";
// TypeScript 7 (native) ships no JS API yet; the 6.x alias does (as in @stackra/gen).
import ts from "typescript6";

import type { ApiProp } from "../src/types/api-prop.type.ts";
import type { ApiSlot } from "../src/types/api-slot.type.ts";
import { omittedNames } from "./omitted-names.function.ts";
import { sourceOf } from "./source-of.function.ts";
import { unwrap } from "./unwrap.function.ts";

/** Members of platform base types (DOM attributes, ViewProps) kept as rows; the rest fold into one `...Base` row. */
const KEPT_PLATFORM_PROPS = new Set(["children", "className", "style", "ref", "id", "testID"]);
/** React Aria's blanket DOM bases (every DOM event, capture phase included) fold the same way. */
const FOLDED_BASES = new Set([
  "GlobalDOMEvents",
  "GlobalDOMAttributes",
  "DOMAttributes",
  "AriaAttributes",
]);
const LITERAL =
  ts.TypeFlags.StringLiteral |
  ts.TypeFlags.NumberLiteral |
  ts.TypeFlags.BooleanLiteral |
  ts.TypeFlags.Null |
  ts.TypeFlags.Undefined;
const TYPE_FORMAT =
  ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;

/** The TS view of one package's props files. */
export class PropsReader {
  private readonly checker: ts.TypeChecker;

  private readonly program: ts.Program;

  private readonly src: string;

  // no parameter properties: node's type stripping runs this file as is
  constructor(src: string, files: readonly string[]) {
    this.src = src;
    const config = ts.getParsedCommandLineOfConfigFile(
      join(src, "..", "tsconfig.json"),
      { noEmit: true },
      { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} },
    );
    this.program = ts.createProgram(files, {
      ...config?.options,
      noEmit: true,
      skipLibCheck: true,
    });
    this.checker = this.program.getTypeChecker();
  }

  /** The main `*Props` (or `*Returns`) type of `file`: its rows, the HeroUI names it refuses and its type name. */
  read(
    file: string,
    platform: "react" | "native",
  ): { typeName: string; target: string; props: ApiProp[]; omitted: string[] } | undefined {
    const decl = this.propsDeclaration(file);
    if (!decl) return undefined;
    const type = this.checker.getTypeAtLocation(decl.name);
    const symbols = new Map<string, ts.Symbol>();
    for (const member of type.isUnion() ? type.types : [type]) {
      for (const symbol of this.checker.getPropertiesOfType(this.checker.getApparentType(member))) {
        if (!symbols.has(symbol.name)) symbols.set(symbol.name, symbol);
      }
    }
    const platformSource = platform === "native" ? ("heroui" as const) : ("react-aria" as const);
    const props: ApiProp[] = [];
    const folded = new Set<string>();
    for (const symbol of symbols.values()) {
      if (symbol.name === "key" || symbol.name.startsWith("__")) continue;
      const declaration = symbol.declarations?.[0];
      const source = sourceOf(declaration?.getSourceFile().fileName ?? "", this.src);
      const parent = declaration?.parent;
      const base =
        parent && (ts.isInterfaceDeclaration(parent) || ts.isTypeAliasDeclaration(parent))
          ? parent.name.text
          : "Attributes";
      const isFolded =
        !KEPT_PLATFORM_PROPS.has(symbol.name) &&
        (!source || (source === "react-aria" && FOLDED_BASES.has(base)));
      if (isFolded) {
        // shortcut: DOM / ViewProps / third-party members fold into one `...<Base>` row per declaring type, as
        // HeroUI's own tables do; upgrade to per-member rows if a page needs them.
        if (!folded.has(base)) {
          folded.add(base);
          props.push({
            name: `...${base}`,
            type: base,
            required: false,
            description: "",
            source: platformSource,
          });
        }
        continue;
      }
      props.push(this.row(symbol, declaration, source ?? platformSource));
    }
    // the aliased type's own name, for a hook's signature (`useX(): Target`)
    const target = ts.isTypeAliasDeclaration(decl) ? decl.type.getText() : decl.name.text;
    return { typeName: decl.name.text, target, props, omitted: omittedNames(decl) };
  }

  /** The keys of a part's `classNames` prop, as native slots. */
  classNameSlots(file: string): ApiSlot[] {
    const decl = this.propsDeclaration(file);
    if (!decl) return [];
    const classNames = this.checker.getPropertyOfType(
      this.checker.getTypeAtLocation(decl.name),
      "classNames",
    );
    const declaration = classNames?.declarations?.[0];
    if (!classNames || !declaration) return [];
    const type = this.checker.getNonNullableType(
      this.checker.getTypeOfSymbolAtLocation(classNames, declaration),
    );
    return this.checker.getPropertiesOfType(type).map((slot) => ({
      name: slot.name,
      description: ts.displayPartsToString(slot.getDocumentationComment(this.checker)).trim(),
    }));
  }

  /** The exported `*Props` (or a hook's `*Returns`) declaration of `file`. */
  private propsDeclaration(
    file: string,
  ): ts.InterfaceDeclaration | ts.TypeAliasDeclaration | undefined {
    return this.program
      .getSourceFile(file)
      ?.statements.find(
        (node): node is ts.InterfaceDeclaration | ts.TypeAliasDeclaration =>
          (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
          /(Props|Returns)$/.test(node.name.text) &&
          !!node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword),
      );
  }

  /** One ApiProp row for a member symbol. */
  private row(
    symbol: ts.Symbol,
    declaration: ts.Declaration | undefined,
    source: ApiProp["source"],
  ): ApiProp {
    const isOptional = (symbol.flags & ts.SymbolFlags.Optional) !== 0;
    const tags = symbol.getJsDocTags(this.checker);
    const tag = (name: string): string | undefined => {
      const found = tags.find((candidate) => candidate.name === name);
      return found ? ts.displayPartsToString(found.text).trim() || name : undefined;
    };
    const description = ts
      .displayPartsToString(symbol.getDocumentationComment(this.checker))
      .trim();
    const fallback =
      tag("default") ?? tag("defaultValue") ?? /Defaults to `([^`]+)`/.exec(description)?.[1];
    const deprecated = tag("deprecated");
    return {
      name: symbol.name,
      type: declaration
        ? this.typeText(this.checker.getTypeOfSymbolAtLocation(symbol, declaration), isOptional)
        : "unknown",
      ...(fallback ? { default: fallback } : {}),
      required: !isOptional,
      description,
      source,
      ...(deprecated ? { deprecated } : {}),
    };
  }

  /** The type as text: enum aliases expanded to their literals, `| undefined` dropped from optional members. */
  private typeText(type: ts.Type, isOptional: boolean): string {
    if (type.isUnion()) {
      const members = type.types.filter(
        (member) => !(isOptional && member.flags & ts.TypeFlags.Undefined),
      );
      if (members.every((member) => member.flags & LITERAL)) {
        const texts = members.map((member) =>
          this.checker.typeToString(member, undefined, TYPE_FORMAT),
        );
        const isBoolean = texts.includes("true") && texts.includes("false");
        const rest = texts.filter((text) => !isBoolean || (text !== "true" && text !== "false"));
        return (isBoolean ? ["boolean", ...rest] : rest).join(" | ");
      }
    }
    const text = this.checker.typeToString(type, undefined, TYPE_FORMAT);
    return isOptional
      ? unwrap(text.replace(/ \| undefined$/, "").replace(/^undefined \| /, ""))
      : text;
  }
}
