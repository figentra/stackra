/**
 * Stackra file contract:
 * Purpose: `createSourceReader`, discovery's analyser over one opened program: it reads each class's kind from the
 *          base its `extends` clause names (bare, called, `Model.with`, `Page.of`, `Widget.place`, an own or a
 *          package class), its options as constants, its partner from the heritage type argument (`Point["slot"]`
 *          included), its constructor tokens, facets, `handle` signature (a `ReplicaPage` output from a `@stackra/*`
 *          package reads as `replica`, ADR 0338; a listener's parameter is its event class, one from
 *          `#stackra/clients/<service>` by its import, or `EventEnvelope` from `@stackra/outbox` as a relay), refusals, statics and traits; each shape's fields from the declared
 *          type node first and the checker second, with rules and constant defaults; each model's entity facts
 *          (`[OptionalProps]` keys, relations with their target, inverse and options, getters); each `Enum.of` in
 *          source order; and each file's exports.
 * Boundary: syntax-first and backend-neutral: every question goes through `TsHost`. Only the member's own source
 *           files under `src/` are read as declarations; a dependency is read only to resolve a kind, an inherited
 *           field or a constant, and its options never (ADR 0294 decision 25). Every refusal is collected with its
 *           fix; nothing throws on bad source. Files are sorted by path so output never follows the import graph.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 16, 17, 20, 25 and 26); ADR 0305 (rules 1, 5 to 13, 19 and 42 to 46); the
 *                     STA-335 type-to-schema and STA-409 partner spikes; ADR 0260 (decision 3: a parameter typed with a
 *                     `#stackra/clients/<service>` client is its class token; decision 4: a listener subscribes to the event class
 *                     its `handle` parameter imports, never to a wire name); ADR 0162 (decision 2: `Translated` and
 *                     `TranslatedStrings` read as the `translated` kind); ADR 0222 (decision 2: `Upload<Bucket>` reads as
 *                     the `upload` kind, its argument a Bucket class).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { refusalCode } from "@stackra/errors";

import { CLIENTS_SPECIFIER } from "#core/constants/clients-specifier.constant";
import { MODEL_TOKENS } from "#core/constants/model-tokens.constant";
import { folderKey } from "#core/functions/folder-key.function";
import { platformConstant } from "#core/functions/platform-constant.function";
import { snakeCase } from "#core/functions/snake-case.function";
import type { ClassRef } from "#core/types/class-ref.type";
import type { ClassValue } from "#core/types/class-value.type";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { EntityIR } from "#core/types/entity-ir.type";
import type { EnumIR } from "#core/types/enum-ir.type";
import type { FacetUse } from "#core/types/facet-use.type";
import type { FieldDefault } from "#core/types/field-default.type";
import type { FieldIR } from "#core/types/field-ir.type";
import type { FieldRule } from "#core/types/field-rule.type";
import type { GenError } from "#core/types/gen-error.type";
import type { RelationIR } from "#core/types/relation-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";
import type { TokenRef } from "#core/types/token-ref.type";
import type { TypeDesc } from "#core/types/type-desc.type";
import { KIND_BASES } from "#node/constants/kind-bases.constant";
import { NOT_CONSTANT } from "#node/constants/not-constant.constant";
import { RELATION_TYPES } from "#node/constants/relation-types.constant";
import { SHAPE_DECORATORS } from "#node/constants/shape-decorators.constant";
import { SHAPE_KINDS } from "#node/constants/shape-kinds.constant";
import type { MemberFacts } from "#node/types/member-facts.type";
import type { SourceReader } from "#node/types/source-reader.type";
import type { TsHost, TsSymbol, TsType } from "#node/types/ts-host.type";
import type { TsNode } from "#node/types/ts-node.type";

/** What a class's `extends` clause names. */
interface Heritage {
  readonly target: TsNode;
  readonly method?: string;
  readonly call?: TsNode;
  readonly typeArguments: readonly TsNode[];
}

/** A class's kind and the classes it inherits fields from, most derived first. */
interface KindInfo {
  readonly kind: string;
  readonly chain: readonly TsNode[];
  readonly base?: ClassRef & { readonly own: boolean };
  readonly derive?: {
    readonly helper: string;
    readonly from: TsNode;
    readonly keys: readonly string[];
  };
}

/** One decorator application. */
interface DecoratorUse {
  readonly name: string;
  readonly local: TsNode;
  readonly args: readonly TsNode[];
  readonly node: TsNode;
}

/** A field read from its declaration, or a relation left to the entity emitter. */
type FieldRead = FieldIR | "relation";

/** The constraint decorators, which the shape compiler applies itself. */
const RULES = new Set(["Str", "Int", "Num", "List", "Trim"]);

/** The relation decorators of a model field, with the relation kind each declares. */
const RELATION_KINDS: Readonly<Record<string, RelationIR["kind"]>> = {
  ManyToOne: "m:1",
  OneToMany: "1:m",
  ManyToMany: "m:n",
  OneToOne: "1:1",
};

/** The relation decorators of a model field. */
const RELATIONS = new Set(Object.keys(RELATION_KINDS));

/** The helpers that derive one shape from another. */
const DERIVERS = new Set(["PickType", "OmitType", "PartialType"]);

/** The callees gen evaluates as constants (ADR 0294 decision 26). */
const PLATFORM_CALLEES =
  /^(Duration\.(seconds|minutes|hours|days|parse)|Money\.(of|ofMinor|zero))$/;

/** The fix printed for a field type the grammar does not allow. */
const FIX_SHAPE =
  "use a shape type: string, an @Int/@Num number, boolean, Date, an enum (Enum.of) or a Schema class";

/** JavaScript's own error classes, which are never refusals. */
const BUILT_IN_ERRORS = new Set([
  "Error",
  "AggregateError",
  "EvalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError",
]);

/** Whether a path is a test file or sits in a `__tests__` folder. */
function isTest(path: string): boolean {
  return path.includes("/__tests__/") || /\.test\.tsx?$/.test(path);
}

/** Whether a path is one of TypeScript's own `lib.*.d.ts` files. */
function isLib(path: string): boolean {
  return /(^|\/)lib\.[\w.-]*\.d\.ts$/.test(path);
}

/** How many number-kind rules (`@Int`, `@Num`) a rule list holds. */
function numberKinds(rules: readonly FieldRule[]): number {
  return rules.filter((rule) => rule.name === "Int" || rule.name === "Num").length;
}

/** The innermost element type of an array or map type. */
function leaf(type: TypeDesc): TypeDesc {
  return type.kind === "array"
    ? leaf(type.element)
    : type.kind === "record"
      ? leaf(type.value)
      : type;
}

/** Whether a constraint rule applies to a type; `@Str` and `@Trim` on a translated field apply to each locale's text. */
function fits(rule: FieldRule, type: TypeDesc): boolean {
  if (rule.name === "Str" || rule.name === "Trim")
    return type.kind === "string" || type.kind === "translated";
  if (rule.name === "Int" || rule.name === "Num") return type.kind === "number";
  return type.kind === "array";
}

/** Whether a value, or anything inside it, is not a constant. */
function hasNonConstant(value: unknown): boolean {
  if (value === NOT_CONSTANT) return true;
  if (Array.isArray(value)) return value.some(hasNonConstant);
  return typeof value === "object" && value !== null && Object.values(value).some(hasNonConstant);
}

/** Whether a value, or anything inside it, is a class reference. */
function hasClassValue(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  if ("$class" in value) return true;
  return Object.values(value).some(hasClassValue);
}

/**
 * The readers of `host`'s program for `facts`'s member.
 *
 * @param host - the opened program.
 * @param facts - the member's facts.
 * @param settings - `includeTests` also reads `__tests__` files (for `discoverWithGen`).
 * @example
 * const reader = createSourceReader(host, facts);
 * for (const file of reader.sources) reader.classes(file);
 */
export function createSourceReader(
  host: TsHost,
  facts: MemberFacts,
  settings: { readonly includeTests?: boolean } = {},
): SourceReader {
  const errors: GenError[] = [];
  const root = facts.root.replace(/\/+$/, "");
  const srcRoot = `${root}/src/`;
  const all = host.files();
  const byPath = new Map(all.map((file) => [file.fileName ?? "", file]));
  const isOwn = (path: string): boolean => path.startsWith(srcRoot) && !path.endsWith(".d.ts");
  const sources = all
    .filter((file) => {
      const path = file.fileName ?? "";
      return isOwn(path) && (settings.includeTests === true || !isTest(path));
    })
    .sort((left, right) => ((left.fileName ?? "") < (right.fileName ?? "") ? -1 : 1));

  const rel = (path: string): string =>
    path.startsWith(`${root}/`) ? path.slice(root.length + 1) : path;
  const kindOf = (node: TsNode | undefined): string => (node === undefined ? "" : host.kind(node));
  const nameOf = (node: TsNode | undefined): string =>
    node?.text ?? (node === undefined ? "" : host.text(node));
  const has = (node: TsNode, modifier: string): boolean =>
    (node.modifiers ?? []).some((candidate) => host.kind(candidate) === modifier);

  // Package names by directory, for "is this declared in a @stackra package".
  const packages = new Map<string, string | undefined>();
  const packageOf = (path: string): string | undefined => {
    let directory = dirname(path);
    const visited: string[] = [];
    while (true) {
      if (packages.has(directory)) {
        const found = packages.get(directory);
        for (const seen of visited) packages.set(seen, found);
        return found;
      }
      visited.push(directory);
      const manifest = join(directory, "package.json");
      if (existsSync(manifest)) {
        let name: string | undefined;
        try {
          const parsed = JSON.parse(readFileSync(manifest, "utf8")) as { name?: unknown };
          name = typeof parsed.name === "string" ? parsed.name : undefined;
        } catch {
          name = undefined;
        }
        for (const seen of visited) packages.set(seen, name);
        return name;
      }
      const parent = dirname(directory);
      if (parent === directory) {
        for (const seen of visited) packages.set(seen, undefined);
        return undefined;
      }
      directory = parent;
    }
  };
  const isStackra = (path: string): boolean => packageOf(path)?.startsWith("@stackra/") === true;

  const moduleOf = (path: string): string => {
    const parts = rel(path).split("/");
    if (
      facts.layout === "service" &&
      parts[1] === "modules" &&
      parts.length > 3 &&
      parts[2] !== undefined
    )
      return folderKey(parts[2]);
    return facts.member;
  };
  const importPathOf = (path: string): string => {
    const parts = rel(path).split("/").slice(1);
    const last = (parts.pop() ?? "").replace(/(\.d)?\.tsx?$/, "");
    if (parts.length === 0) return `#src/${last}`;
    const [folder, ...rest] = parts;
    return `#${folder ?? "src"}/${[...rest, last].join("/")}`;
  };

  const fail = (
    node: TsNode,
    subject: string,
    code: string,
    message: string,
    fix: string,
  ): void => {
    const { line, column } = host.position(node);
    errors.push({ code, file: rel(host.fileName(node)), line, column, subject, message, fix });
  };

  // Imports per file: local name to module specifier.
  const importCache = new Map<string, Map<string, string>>();
  const importsOf = (path: string): Map<string, string> => {
    const cached = importCache.get(path);
    if (cached !== undefined) return cached;
    const map = new Map<string, string>();
    for (const statement of byPath.get(path)?.statements ?? []) {
      if (host.kind(statement) !== "ImportDeclaration") continue;
      const from = statement.moduleSpecifier?.text;
      const clause = statement.importClause;
      if (from === undefined || clause === undefined) continue;
      if (clause.name !== undefined) map.set(nameOf(clause.name), from);
      const bindings = clause.namedBindings;
      if (bindings === undefined) continue;
      if (bindings.name !== undefined) map.set(nameOf(bindings.name), from);
      for (const element of bindings.elements ?? []) map.set(nameOf(element.name), from);
    }
    importCache.set(path, map);
    return map;
  };

  const classDeclarationOf = (symbol: TsSymbol | undefined): TsNode | undefined =>
    symbol === undefined
      ? undefined
      : host
          .declarations(symbol)
          .find((declaration) => host.kind(declaration) === "ClassDeclaration");

  /** A class or constant referenced at `at`, and where a generated file imports it from. */
  const refOf = (at: TsNode, symbol: TsSymbol): ClassRef => {
    const declaration = host.declarations(symbol)[0];
    const path = declaration === undefined ? "" : host.fileName(declaration);
    const name = host.symbolName(symbol);
    if (isOwn(path)) return { name, from: importPathOf(path) };
    const local = kindOf(at) === "Identifier" ? nameOf(at) : name;
    return { name, from: importsOf(host.fileName(at)).get(local) ?? packageOf(path) ?? path };
  };

  // The constant evaluator.
  const constant = (node: TsNode | undefined): unknown => {
    if (node === undefined) return NOT_CONSTANT;
    switch (host.kind(node)) {
      case "NumericLiteral":
        return Number(nameOf(node).replaceAll("_", ""));
      case "StringLiteral":
      case "NoSubstitutionTemplateLiteral":
        return node.text ?? "";
      case "TrueKeyword":
        return true;
      case "FalseKeyword":
        return false;
      case "NullKeyword":
        return null;
      case "RegularExpressionLiteral": {
        const raw = nameOf(node);
        const end = raw.lastIndexOf("/");
        return { $regex: raw.slice(1, end), flags: raw.slice(end + 1) };
      }
      case "PrefixUnaryExpression": {
        const value = constant(node.operand);
        return node.operator !== undefined &&
          host.kindName(node.operator) === "MinusToken" &&
          typeof value === "number"
          ? -value
          : NOT_CONSTANT;
      }
      case "ParenthesizedExpression":
      case "AsExpression":
      case "SatisfiesExpression":
      case "NonNullExpression":
      case "TypeAssertionExpression":
        return constant(node.expression);
      case "ArrayLiteralExpression": {
        const items = (node.elements ?? []).map(constant);
        return items.some((item) => item === NOT_CONSTANT) ? NOT_CONSTANT : items;
      }
      case "ObjectLiteralExpression": {
        const entries: [string, unknown][] = [];
        for (const property of node.properties ?? []) {
          const kind = host.kind(property);
          if (kind === "PropertyAssignment")
            entries.push([nameOf(property.name), constant(property.initializer)]);
          else if (kind === "ShorthandPropertyAssignment")
            entries.push([nameOf(property.name), constant(property.name)]);
          else return NOT_CONSTANT;
        }
        return entries.some(([, value]) => value === NOT_CONSTANT)
          ? NOT_CONSTANT
          : Object.fromEntries(entries);
      }
      case "Identifier":
        if (nameOf(node) === "undefined") return undefined;
        return reference(node);
      case "PropertyAccessExpression":
        return reference(node);
      case "CallExpression": {
        const callee = node.expression === undefined ? "" : host.text(node.expression);
        if (!PLATFORM_CALLEES.test(callee)) return NOT_CONSTANT;
        const args = (node.arguments ?? []).map(constant);
        if (args.some((arg) => arg === NOT_CONSTANT)) return NOT_CONSTANT;
        try {
          return platformConstant(callee, args)?.value ?? NOT_CONSTANT;
        } catch {
          return NOT_CONSTANT;
        }
      }
      default:
        return NOT_CONSTANT;
    }
  };

  /** A class, a static of a class, or a literal-typed name. */
  const reference = (node: TsNode): unknown => {
    const symbol = host.symbolAt(node);
    const declaration = classDeclarationOf(symbol);
    if (symbol !== undefined && declaration !== undefined) {
      const kind = kindInfo(declaration)?.kind;
      return {
        $class: host.symbolName(symbol),
        from: refOf(node, symbol).from,
        ...(kind ? { kind } : {}),
      } satisfies ClassValue;
    }
    if (kindOf(node) === "PropertyAccessExpression" && node.expression !== undefined) {
      const owner = host.symbolAt(node.expression);
      const ownerClass = classDeclarationOf(owner);
      if (owner !== undefined && ownerClass !== undefined) {
        const kind = kindInfo(ownerClass)?.kind;
        return {
          $class: host.symbolName(owner),
          from: refOf(node.expression, owner).from,
          member: nameOf(node.name),
          ...(kind ? { kind } : {}),
        } satisfies ClassValue;
      }
    }
    const value = host.literal(host.typeAt(node));
    return value === undefined ? NOT_CONSTANT : value;
  };

  /** The options object of a call argument: its constant properties, non-constant ones left out. */
  const optionsOf = (node: TsNode | undefined): Record<string, unknown> => {
    if (node === undefined || host.kind(node) !== "ObjectLiteralExpression") return {};
    const options: Record<string, unknown> = {};
    for (const property of node.properties ?? []) {
      const kind = host.kind(property);
      const value =
        kind === "PropertyAssignment"
          ? constant(property.initializer)
          : kind === "ShorthandPropertyAssignment"
            ? constant(property.name)
            : NOT_CONSTANT;
      const name = nameOf(property.name);
      if (!hasNonConstant(value)) options[name] = value;
      // ADR 0360 d4: `tool: false` carries its reason as a `// reason:` line, as `@Field(zod)` does.
      if (name === "tool" && value === false) {
        const reason = /\/\/\s*reason:\s*(.+)/.exec(host.leading(property))?.[1]?.trim();
        if (reason) options["toolReason"] = reason;
      }
    }
    return options;
  };

  const heritageOf = (node: TsNode): Heritage | undefined => {
    const clause = (node.heritageClauses ?? []).find(
      (candidate) =>
        candidate.token !== undefined && host.kindName(candidate.token) === "ExtendsKeyword",
    );
    const heritage = clause?.types?.[0];
    let callee = heritage?.expression;
    if (heritage === undefined || callee === undefined) return undefined;
    let call: TsNode | undefined;
    let typeArguments = heritage.typeArguments ?? [];
    if (host.kind(callee) === "CallExpression" && callee.expression !== undefined) {
      call = callee;
      typeArguments = callee.typeArguments ?? typeArguments;
      callee = callee.expression;
    }
    if (host.kind(callee) === "PropertyAccessExpression" && callee.expression !== undefined)
      return {
        target: callee.expression,
        method: nameOf(callee.name),
        ...(call ? { call } : {}),
        typeArguments,
      };
    return { target: callee, ...(call ? { call } : {}), typeArguments };
  };

  // Kinds, cached per class node.
  const kinds = new Map<TsNode, KindInfo | null>();
  const kindInfo = (node: TsNode, seen: ReadonlySet<TsNode> = new Set()): KindInfo | undefined => {
    const cached = kinds.get(node);
    if (cached !== undefined) return cached ?? undefined;
    if (seen.has(node)) return undefined;
    const info = readKind(node, new Set([...seen, node]));
    kinds.set(node, info ?? null);
    return info;
  };
  const readKind = (node: TsNode, seen: ReadonlySet<TsNode>): KindInfo | undefined => {
    const heritage = heritageOf(node);
    if (heritage === undefined) return undefined;
    const symbol = host.symbolAt(heritage.target);
    if (symbol === undefined) return undefined;
    const name = host.symbolName(symbol);
    const declarations = host.declarations(symbol);
    const path = declarations[0] === undefined ? "" : host.fileName(declarations[0]);
    if (DERIVERS.has(name) && isStackra(path)) {
      const source = heritage.call?.arguments?.[0];
      const from = classDeclarationOf(source === undefined ? undefined : host.symbolAt(source));
      const inner = from === undefined ? undefined : kindInfo(from, seen);
      if (from === undefined || inner === undefined) return undefined;
      const keys = constant(heritage.call?.arguments?.[1]);
      return {
        kind: inner.kind,
        chain: [node],
        derive: { helper: name, from, keys: Array.isArray(keys) ? keys.map(String) : [] },
      };
    }
    const kind = KIND_BASES[name];
    if (kind !== undefined && isStackra(path)) return { kind, chain: [node] };
    const declaration = classDeclarationOf(symbol);
    if (declaration !== undefined) {
      const inner = kindInfo(declaration, seen);
      if (inner === undefined) return undefined;
      return {
        kind: inner.kind,
        chain: [node, ...inner.chain],
        base: { ...refOf(heritage.target, symbol), own: isOwn(path) },
      };
    }
    // A declaration file's `declare const X_base: ConfigClass<...>`: the class type names the kind.
    for (const candidate of declarations) {
      const type = candidate.type;
      if (
        host.kind(candidate) !== "VariableDeclaration" ||
        type === undefined ||
        type.typeName === undefined
      )
        continue;
      const base = KIND_BASES[host.text(type.typeName).replace(/(Class|Kind)$/, "")];
      if (base !== undefined) return { kind: base, chain: [node] };
    }
    return undefined;
  };

  const decoratorsOf = (node: TsNode): DecoratorUse[] =>
    (node.modifiers ?? [])
      .filter(
        (modifier) => host.kind(modifier) === "Decorator" && modifier.expression !== undefined,
      )
      .map((decorator) => {
        const expression = decorator.expression as TsNode;
        const isCall = host.kind(expression) === "CallExpression";
        const local = (isCall ? expression.expression : expression) ?? expression;
        const symbol = host.symbolAt(local);
        return {
          name: symbol === undefined ? nameOf(local) : host.symbolName(symbol),
          local,
          args: isCall ? (expression.arguments ?? []) : [],
          node: decorator,
        };
      });

  const facetOf = (
    use: DecoratorUse,
    target: FacetUse["target"],
    member?: string,
  ): FacetUse | undefined => {
    if (SHAPE_DECORATORS.includes(use.name)) return undefined;
    const symbol = host.symbolAt(use.local);
    const declaration =
      symbol === undefined
        ? undefined
        : (host.valueDeclaration(symbol) ?? host.declarations(symbol)[0]);
    if (symbol === undefined || declaration === undefined) return undefined;
    // A package function that wraps its `createDecorator` (`Searchable(options): DecoratorFunction`) is a facet too.
    const wrapped =
      host.kind(declaration) === "FunctionDeclaration" &&
      declaration.type !== undefined &&
      /\bDecoratorFunction\b/.test(host.text(declaration.type)) &&
      isStackra(host.fileName(declaration));
    if (host.kind(declaration) !== "VariableDeclaration" && !wrapped) return undefined;
    const made =
      wrapped ||
      (declaration.initializer !== undefined &&
        /\bcreateDecorator\s*[<(]/.test(host.text(declaration.initializer))) ||
      (declaration.type !== undefined &&
        /(^|[^\w])Decorator\s*</.test(host.text(declaration.type)));
    if (!made) return undefined;
    const value = use.args[0] === undefined ? undefined : constant(use.args[0]);
    return {
      name: use.name,
      kind: snakeCase(use.name),
      target,
      ...(member !== undefined ? { member } : {}),
      options: hasNonConstant(value) ? undefined : value,
      from: refOf(use.local, symbol).from,
    };
  };

  /** Whether `name`, as seen from `path`, is a refusal class. */
  const isRefusal = (path: string, name: string): boolean => {
    if (BUILT_IN_ERRORS.has(name)) return false;
    for (const statement of byPath.get(path)?.statements ?? []) {
      if (host.kind(statement) === "ClassDeclaration" && nameOf(statement.name) === name)
        return kindInfo(statement)?.kind === "refusal";
      if (host.kind(statement) !== "ImportDeclaration") continue;
      for (const element of statement.importClause?.namedBindings?.elements ?? []) {
        if (nameOf(element.name) !== name || element.name === undefined) continue;
        const declaration = classDeclarationOf(host.symbolAt(element.name));
        return declaration !== undefined && kindInfo(declaration)?.kind === "refusal";
      }
    }
    return false;
  };

  /** The own shape class a type node names, when it names one. */
  const shapeClassAt = (
    node: TsNode | undefined,
  ): { name: string; module: string; node: TsNode } | undefined => {
    if (node === undefined || host.kind(node) !== "TypeReference" || node.typeName === undefined)
      return undefined;
    const symbol = host.symbolAt(node.typeName);
    const declaration = classDeclarationOf(symbol);
    if (symbol === undefined || declaration === undefined || !isOwn(host.fileName(declaration)))
      return undefined;
    const kind = kindInfo(declaration)?.kind;
    if (kind === undefined || !SHAPE_KINDS.includes(kind) || kind === "model") return undefined;
    return {
      name: host.symbolName(symbol),
      module: moduleOf(host.fileName(declaration)),
      node: declaration,
    };
  };

  // Field types.
  const enumOf = (symbol: TsSymbol | undefined, at?: TsNode): TypeDesc | undefined => {
    if (symbol === undefined) return undefined;
    const declaration = host.valueDeclaration(symbol);
    const init = declaration?.initializer;
    const argument = init?.arguments?.[0];
    if (
      declaration !== undefined &&
      init !== undefined &&
      host.kind(init) === "CallExpression" &&
      init.expression !== undefined &&
      host.text(init.expression) === "Enum.of" &&
      argument !== undefined &&
      host.kind(argument) === "ObjectLiteralExpression"
    ) {
      const values = (argument.properties ?? []).map((property) => {
        const value = property.initializer;
        return value !== undefined && host.kind(value) === "ArrayLiteralExpression"
          ? nameOf(value.elements?.[0])
          : nameOf(value);
      });
      const path = host.fileName(declaration);
      return {
        kind: "enum",
        name: host.symbolName(symbol),
        values,
        ...(isOwn(path) ? { module: moduleOf(path) } : {}),
      };
    }
    if (at === undefined || declaration === undefined || !isStackra(host.fileName(declaration)))
      return undefined;
    // A published enum without its initializer: its codes from the checker (sorted, the alias order is lost).
    const members = host.unionMembers(host.typeAt(at)) ?? [];
    const values = members
      .map((member) => host.literal(member))
      .filter((value): value is string => typeof value === "string");
    return values.length > 0
      ? { kind: "enum", name: host.symbolName(symbol), values: values.sort() }
      : undefined;
  };

  const unknownType = (
    node: TsNode,
    subject: string,
    quiet: boolean,
    message?: string,
    fix?: string,
  ): TypeDesc => {
    if (!quiet)
      fail(
        node,
        subject,
        "shape_unknown_type",
        message ?? `\`${host.text(node)}\` is not a shape type`,
        fix ?? FIX_SHAPE,
      );
    return { kind: "json" };
  };

  const isNullish = (node: TsNode): boolean =>
    host.kind(node) === "UndefinedKeyword" ||
    (host.kind(node) === "LiteralType" &&
      node.literal !== undefined &&
      host.kind(node.literal) === "NullKeyword");

  /** The fields of a class typed with an enum case or a literal: the candidates for a union discriminant. */
  const literalFields = (node: TsNode): string[] =>
    (node.members ?? [])
      .filter(
        (member) =>
          host.kind(member) === "PropertyDeclaration" &&
          member.type !== undefined &&
          (host.kind(member.type) === "TypeQuery" || host.kind(member.type) === "LiteralType"),
      )
      .map((member) => nameOf(member.name));
  const discriminatorOf = (members: readonly TsNode[]): string | undefined => {
    const [first, ...rest] = members.map(literalFields);
    return first?.find((name) => rest.every((fields) => fields.includes(name)));
  };

  const readTypeNode = (
    node: TsNode,
    subject: string,
    quiet: boolean,
  ): { type: TypeDesc; nullable: boolean } => {
    const kind = host.kind(node);
    if (kind === "ParenthesizedType" && node.type !== undefined)
      return readTypeNode(node.type, subject, quiet);
    if (kind === "UnionType") {
      const types = node.types ?? [];
      const nullable = types.some(
        (type) =>
          host.kind(type) === "LiteralType" &&
          type.literal !== undefined &&
          host.kind(type.literal) === "NullKeyword",
      );
      const rest = types.filter((type) => !isNullish(type));
      if (rest.length === 1 && rest[0] !== undefined)
        return { type: readTypeNode(rest[0], subject, quiet).type, nullable };
      const shapes = rest.map(shapeClassAt);
      if (shapes.length > 1 && shapes.every((shape) => shape !== undefined)) {
        const found = shapes.filter(
          (shape): shape is NonNullable<typeof shape> => shape !== undefined,
        );
        const discriminator = discriminatorOf(found.map((shape) => shape.node));
        if (discriminator !== undefined)
          return {
            type: {
              kind: "union",
              discriminator,
              members: found.map(({ name, module }) => ({ name, module })),
            },
            nullable,
          };
        return {
          type: unknownType(
            node,
            subject,
            quiet,
            `the union \`${host.text(node)}\` has no discriminant field`,
            "give every member schema the same field typed with an enum case (`kind: typeof CtaKind.Link`)",
          ),
          nullable,
        };
      }
      return {
        type: unknownType(
          node,
          subject,
          quiet,
          `the union \`${host.text(node)}\` is not a shape type`,
          `${FIX_SHAPE}; a union of schema classes needs an enum-case discriminant, any other union @Field(zod) with a \`// reason:\` line`,
        ),
        nullable,
      };
    }
    return { type: readSingleType(node, subject, quiet), nullable: false };
  };

  const elementOf = (node: TsNode, subject: string, quiet: boolean): TypeDesc => {
    const { type, nullable } = readTypeNode(node, subject, quiet);
    if (nullable)
      return unknownType(
        node,
        subject,
        quiet,
        "a nullable element is not a shape type",
        "drop `| null` from the element",
      );
    return type;
  };

  const readSingleType = (node: TsNode, subject: string, quiet: boolean): TypeDesc => {
    switch (host.kind(node)) {
      case "StringKeyword":
        return { kind: "string" };
      case "NumberKeyword":
        return { kind: "number" };
      case "BooleanKeyword":
        return { kind: "boolean" };
      case "ArrayType":
        return node.elementType === undefined
          ? unknownType(node, subject, quiet)
          : { kind: "array", element: elementOf(node.elementType, subject, quiet) };
      case "TypeOperator":
        // `readonly T[]`
        return node.type === undefined
          ? unknownType(node, subject, quiet)
          : readSingleType(node.type, subject, quiet);
      case "TypeQuery": {
        const value = host.literal(host.typeAt(node));
        return typeof value === "string"
          ? { kind: "enum", name: host.text(node).replace(/^typeof\s+/, ""), values: [value] }
          : unknownType(node, subject, quiet);
      }
      case "AnyKeyword":
        return unknownType(node, subject, quiet, "`any` is not a shape type");
      case "UnknownKeyword":
        return unknownType(
          node,
          subject,
          quiet,
          "`unknown` is not a shape type",
          `${FIX_SHAPE}; free-form data is Json`,
        );
      case "TypeLiteral":
        return unknownType(
          node,
          subject,
          quiet,
          "an inline object type is not a shape type",
          "move the fields to a Schema class",
        );
      case "LiteralType":
        return unknownType(
          node,
          subject,
          quiet,
          `the literal type \`${host.text(node)}\` is not a shape type`,
          "use an enum (Enum.of)",
        );
      case "TypeReference":
        return readTypeReference(node, subject, quiet);
      default:
        return unknownType(node, subject, quiet);
    }
  };

  const readTypeReference = (node: TsNode, subject: string, quiet: boolean): TypeDesc => {
    const symbol = node.typeName === undefined ? undefined : host.symbolAt(node.typeName);
    if (symbol === undefined) return unknownType(node, subject, quiet);
    const name = host.symbolName(symbol);
    const args = node.typeArguments ?? [];
    const declaration = host.declarations(symbol)[0];
    const path = declaration === undefined ? "" : host.fileName(declaration);
    if (isLib(path)) {
      if (name === "Date") return { kind: "date" };
      if ((name === "Array" || name === "ReadonlyArray") && args[0] !== undefined)
        return { kind: "array", element: elementOf(args[0], subject, quiet) };
      if (
        (name === "Record" || name === "ReadonlyRecord") &&
        args[0] !== undefined &&
        args[1] !== undefined &&
        host.kind(args[0]) === "StringKeyword"
      )
        return { kind: "record", value: elementOf(args[1], subject, quiet) };
      return unknownType(node, subject, quiet);
    }
    if (isStackra(path)) {
      if (name === "PublicId" && args[0]?.literal !== undefined)
        return { kind: "public_id", prefix: nameOf(args[0].literal) };
      if (name === "Money") return { kind: "money" };
      if (name === "Json") return { kind: "json" };
      if (name === "Duration") return { kind: "duration" };
      if (name === "Url") return { kind: "brand", brand: "url" };
      if (name === "Email") return { kind: "brand", brand: "email" };
      if (name === "CurrencyCode") return { kind: "brand", brand: "currency_code" };
      if (name === "Translated") return { kind: "translated", form: "value" };
      if (name === "TranslatedStrings") return { kind: "translated", form: "strings" };
      if (name === "Upload") {
        if (args[0] === undefined) return { kind: "upload" };
        const bucket = args[0].typeName === undefined ? undefined : host.symbolAt(args[0].typeName);
        const declared = classDeclarationOf(bucket);
        if (bucket === undefined || declared === undefined || kindInfo(declared)?.kind !== "bucket")
          return unknownType(
            node,
            subject,
            quiet,
            `\`${host.text(args[0])}\` in \`${host.text(node)}\` is not a Bucket class`,
            "name a class that extends Bucket({...}): `Upload<ProductImagesBucket>`",
          );
        return { kind: "upload", bucket: host.symbolName(bucket) };
      }
      if (name === "DriverName" && args[0] !== undefined) {
        const port = args[0].typeName === undefined ? undefined : host.symbolAt(args[0].typeName);
        return {
          kind: "driver_name",
          port: port === undefined ? host.text(args[0]) : host.symbolName(port),
          values: [],
        };
      }
      if (
        name === "Value" &&
        args[0] !== undefined &&
        host.kind(args[0]) === "TypeQuery" &&
        args[0].exprName !== undefined
      )
        return enumOf(host.symbolAt(args[0].exprName), node) ?? unknownType(node, subject, quiet);
    }
    const declarationClass = classDeclarationOf(symbol);
    if (declarationClass !== undefined) {
      const kind = kindInfo(declarationClass)?.kind;
      const own = isOwn(host.fileName(declarationClass));
      if (kind === "model")
        return unknownType(
          node,
          subject,
          quiet,
          `the model \`${name}\` is used as a plain field type`,
          "type a relation `Ref<T>`, `Collection<T>` or `Link<T>` with a relation decorator, or use the model's View schema",
        );
      if (own && kind !== undefined && SHAPE_KINDS.includes(kind))
        return { kind: "schema", name, module: moduleOf(host.fileName(declarationClass)) };
      return unknownType(
        node,
        subject,
        quiet,
        `\`${name}\` is not a shape of this member`,
        "declare a Schema class in this member for the field (a dependency's shape is not compiled again)",
      );
    }
    if (host.symbolHas(symbol, "Interface"))
      return unknownType(
        node,
        subject,
        quiet,
        `the interface \`${name}\` is not a shape type`,
        `make \`${name}\` a class that extends Schema`,
      );
    return enumOf(symbol, node) ?? unknownType(node, subject, quiet);
  };

  /** A field type from the checker: a field with no type node, or a field a kind base or trait adds. */
  const readChecker = (
    type: TsType,
    at: TsNode,
    subject: string,
    quiet: boolean,
    initializer?: TsNode,
  ): { type: TypeDesc; nullable: boolean } => {
    const members = host.unionMembers(type) ?? [type];
    const nullable = members.some((member) => host.typeHas(member, "Null"));
    const rest = members.filter(
      (member) => !host.typeHas(member, "Null") && !host.typeHas(member, "Undefined"),
    );
    const alias = host.typeAlias(type);
    const aliasDeclaration = alias === undefined ? undefined : host.declarations(alias.symbol)[0];
    if (
      alias !== undefined &&
      host.symbolName(alias.symbol) === "PublicId" &&
      aliasDeclaration !== undefined &&
      isStackra(host.fileName(aliasDeclaration))
    )
      return {
        type: {
          kind: "public_id",
          prefix: String(alias.args[0] === undefined ? "" : host.literal(alias.args[0])),
        },
        nullable,
      };
    if (rest.length === 2 && rest.every((member) => host.typeHas(member, "BooleanLiteral")))
      return { type: { kind: "boolean" }, nullable };
    const [only] = rest;
    if (rest.length === 1 && only !== undefined) {
      if (host.typeHas(only, "String")) return { type: { kind: "string" }, nullable };
      if (host.typeHas(only, "Number")) return { type: { kind: "number" }, nullable };
      if (host.typeHas(only, "Boolean")) return { type: { kind: "boolean" }, nullable };
      const symbol = host.typeSymbol(only);
      const declaration = symbol === undefined ? undefined : host.declarations(symbol)[0];
      if (
        symbol !== undefined &&
        host.symbolName(symbol) === "Date" &&
        declaration !== undefined &&
        isLib(host.fileName(declaration))
      )
        return { type: { kind: "date" }, nullable };
      if (host.literal(only) !== undefined) {
        const enumName =
          initializer !== undefined &&
          host.kind(initializer) === "PropertyAccessExpression" &&
          initializer.expression !== undefined
            ? host.text(initializer.expression)
            : undefined;
        const field = subject.split(".").pop() ?? subject;
        return {
          type: unknownType(
            at,
            subject,
            quiet,
            `the inferred literal type \`${host.typeText(only)}\` is not a shape type`,
            enumName !== undefined && initializer !== undefined
              ? `annotate the field: \`${field}: ${enumName} = ${host.text(initializer)}\``
              : FIX_SHAPE,
          ),
          nullable,
        };
      }
    }
    return {
      type: unknownType(
        at,
        subject,
        quiet,
        `\`${host.typeText(type)}\` (inferred) is not a shape type`,
        "annotate the field with a shape type",
      ),
      nullable,
    };
  };

  /** Checks that the rules fit the type; a number gets its kind here. */
  const checkRules = (field: FieldIR, at: TsNode, subject: string): void => {
    const own = field.rules.filter((rule) => rule.options["each"] !== true);
    const each = field.rules.filter((rule) => rule.options["each"] === true);
    const target = field.type;
    if (target.kind === "number" && numberKinds(own) !== 1)
      fail(
        at,
        subject,
        "shape_number_kind",
        numberKinds(own) === 0
          ? "a number field needs @Int or @Num"
          : "a number field takes @Int or @Num, not both",
        "add @Int() for whole numbers or @Num() for decimals above the field",
      );
    const inner = leaf(target);
    const isContainer = target.kind === "array" || target.kind === "record";
    if (isContainer && inner.kind === "number" && numberKinds(each) !== 1)
      fail(
        at,
        subject,
        "shape_number_kind",
        "a number inside an array or map needs @Int({ each: true }) or @Num({ each: true })",
        "add @Int({ each: true }) or @Num({ each: true }) above the field",
      );
    for (const rule of own)
      if (!fits(rule, target))
        fail(
          at,
          subject,
          "shape_decorator_type_mismatch",
          `@${rule.name} does not apply to a ${target.kind} field`,
          `remove @${rule.name}, or change the field type`,
        );
    for (const rule of each)
      if (!isContainer || !fits(rule, inner))
        fail(
          at,
          subject,
          "shape_decorator_type_mismatch",
          `@${rule.name}({ each: true }) needs an array or map of ${rule.name === "Str" || rule.name === "Trim" ? "strings" : "numbers"}`,
          "remove `each: true`, or change the field type",
        );
  };

  /** A field's constant default. */
  const defaultOf = (init: TsNode, subject: string, quiet: boolean): FieldDefault | undefined => {
    const refuse = (message: string): undefined => {
      if (quiet) return undefined;
      fail(
        init,
        subject,
        "shape_default_not_constant",
        message,
        "use a literal, an enum case, a literal-typed constant, null, [] or {}, or Duration.* / Money.of; compute other values in X.create()",
      );
      return undefined;
    };
    if (host.kind(init) === "CallExpression") {
      const callee = init.expression === undefined ? "" : host.text(init.expression);
      const args = (init.arguments ?? []).map(constant);
      if (args.some(hasNonConstant))
        return refuse(`the arguments of \`${host.text(init)}\` are not constants`);
      try {
        return (
          platformConstant(callee, args) ??
          refuse(`the default \`${host.text(init)}\` is not a constant`)
        );
      } catch (error) {
        return refuse(`the default \`${host.text(init)}\` is refused: ${(error as Error).message}`);
      }
    }
    const value = constant(init);
    if (value === undefined) return undefined;
    if (
      hasNonConstant(value) ||
      hasClassValue(value) ||
      (typeof value === "object" && value !== null && "$regex" in value)
    )
      return refuse(`the default \`${host.text(init)}\` is not a constant`);
    return { value, code: JSON.stringify(value), imports: [] };
  };

  /** Whether a type node is a relation type (`Ref<T>`, `Collection<T>`, `Link<T>`), alone or with `| null`. */
  const isRelationType = (node: TsNode | undefined): boolean => {
    if (node === undefined) return false;
    if (host.kind(node) === "UnionType") return (node.types ?? []).some(isRelationType);
    if (host.kind(node) !== "TypeReference" || node.typeName === undefined) return false;
    const symbol = host.symbolAt(node.typeName);
    const declaration = symbol === undefined ? undefined : host.declarations(symbol)[0];
    return (
      symbol !== undefined &&
      RELATION_TYPES.includes(host.symbolName(symbol)) &&
      declaration !== undefined &&
      isStackra(host.fileName(declaration))
    );
  };

  const readField = (
    shape: string,
    declaration: TsNode,
    value: TsNode,
    quiet: boolean,
    quietDefault: boolean,
  ): FieldRead => {
    const name = nameOf(declaration.name);
    const subject = `${shape}.${name}`;
    const decorators = decoratorsOf(declaration);
    if (decorators.some((use) => RELATIONS.has(use.name)) || isRelationType(declaration.type))
      return "relation";
    const hatch = decorators.find((use) => use.name === "Field");
    let type: TypeDesc;
    let nullable = false;
    if (hatch !== undefined) {
      if (!quiet && !/\/\/\s*reason:/.test(host.leading(declaration)))
        fail(
          hatch.node,
          subject,
          "shape_hatch_reason_missing",
          "@Field(zod) needs a reason",
          "add a `// reason: <why no type fits>` line above @Field",
        );
      type = {
        kind: "hatch",
        source: hatch.args[0] === undefined ? "z.unknown()" : host.text(hatch.args[0]),
      };
      nullable =
        declaration.type !== undefined &&
        host.kind(declaration.type) === "UnionType" &&
        (declaration.type.types ?? []).some(
          (member) =>
            host.kind(member) === "LiteralType" &&
            member.literal !== undefined &&
            host.kind(member.literal) === "NullKeyword",
        );
    } else if (declaration.type !== undefined) {
      ({ type, nullable } = readTypeNode(declaration.type, subject, quiet));
    } else {
      const at = declaration.name ?? declaration;
      ({ type, nullable } = readChecker(
        host.typeAt(at),
        at,
        subject,
        quiet,
        declaration.initializer,
      ));
    }
    const rules: FieldRule[] = [];
    for (const use of decorators) {
      if (!RULES.has(use.name)) continue;
      const options = use.args[0] === undefined ? {} : constant(use.args[0]);
      if (hasNonConstant(options) || typeof options !== "object" || options === null) {
        if (!quiet)
          fail(
            use.node,
            subject,
            "shape_rule_not_constant",
            `the arguments of @${use.name} are not constants`,
            "use literals or literal-typed `const` values (`export const MAX = 100`)",
          );
        continue;
      }
      rules.push({
        name: use.name as FieldRule["name"],
        options: options as Record<string, unknown>,
      });
    }
    const renamed = decorators.find((use) => use.name === "Renamed");
    const renamedTo = renamed === undefined ? undefined : constant(renamed.args[0]);
    const initial =
      value.initializer === undefined
        ? undefined
        : defaultOf(value.initializer, subject, quietDefault);
    const field: FieldIR = {
      name,
      optional: host.isOptional(declaration),
      nullable,
      type,
      rules,
      ...(initial !== undefined ? { default: initial } : {}),
      ...(typeof renamedTo === "string" ? { renamed: renamedTo } : {}),
    };
    if (!quiet && type.kind !== "hatch")
      checkRules(field, declaration.name ?? declaration, subject);
    return field;
  };

  /** The data properties of a class node. */
  const propertiesOf = (node: TsNode): TsNode[] =>
    (node.members ?? []).filter(
      (member) =>
        host.kind(member) === "PropertyDeclaration" &&
        kindOf(member.name) === "Identifier" &&
        !has(member, "StaticKeyword") &&
        !has(member, "PrivateKeyword") &&
        !has(member, "ProtectedKeyword"),
    );

  /** The fields of a chain (base-most declaration holds type and rules, most derived initializer is the default). */
  const fieldsOf = (
    shape: string,
    chain: readonly TsNode[],
    only?: TsNode,
  ): { fields: FieldIR[]; relations: string[] } => {
    const byName = new Map<string, { declaration: TsNode; value: TsNode }>();
    for (let index = chain.length - 1; index >= 0; index -= 1)
      for (const property of propertiesOf(chain[index] as TsNode)) {
        const name = nameOf(property.name);
        const entry = byName.get(name);
        if (entry === undefined) byName.set(name, { declaration: property, value: property });
        else if (property.initializer !== undefined) entry.value = property;
      }
    const declaredHere =
      only === undefined
        ? undefined
        : new Set(propertiesOf(only).map((property) => nameOf(property.name)));
    const fields: FieldIR[] = [];
    const relations: string[] = [];
    for (const [name, { declaration, value }] of byName) {
      if (declaredHere !== undefined && !declaredHere.has(name)) continue;
      // A dependency's declaration is read for its type and rules but never reported on: the author cannot fix it.
      const field = readField(
        shape,
        declaration,
        value,
        !isOwn(host.fileName(declaration)),
        !isOwn(host.fileName(value)),
      );
      if (field === "relation") relations.push(name);
      else fields.push(field);
    }
    return { fields, relations };
  };

  /** The relation of a model field: its kind from the decorator or `Link<T>`, its target, inverse side and options. */
  const relationOf = (shape: string, property: TsNode): RelationIR | undefined => {
    const name = nameOf(property.name);
    const decorator = decoratorsOf(property).find((use) => RELATIONS.has(use.name));
    const members =
      property.type === undefined
        ? []
        : host.kind(property.type) === "UnionType"
          ? (property.type.types ?? [])
          : [property.type];
    const typed = members.find((member) => host.kind(member) === "TypeReference");
    const typeSymbol = typed?.typeName === undefined ? undefined : host.symbolAt(typed.typeName);
    const typeName = typeSymbol === undefined ? undefined : host.symbolName(typeSymbol);
    const kind =
      typeName === "Link"
        ? "link"
        : decorator === undefined
          ? undefined
          : RELATION_KINDS[decorator.name];
    const thunk = decorator?.args[0];
    const targetNode =
      thunk !== undefined && host.kind(thunk) === "ArrowFunction"
        ? thunk.body
        : typed?.typeArguments?.[0]?.typeName;
    const targetSymbol = targetNode === undefined ? undefined : host.symbolAt(targetNode);
    const targetClass = classDeclarationOf(targetSymbol);
    if (
      kind === undefined ||
      targetNode === undefined ||
      targetSymbol === undefined ||
      targetClass === undefined
    ) {
      if (isOwn(host.fileName(property)))
        fail(
          property.name ?? property,
          `${shape}.${name}`,
          "relation_decorator_missing",
          `\`${name}\` is a relation gen cannot read: no relation decorator names its target model`,
          "add `@ManyToOne(() => Target)`, `@OneToMany(() => Target, (row) => row.back)` or `@ManyToMany(() => Target)`, or type a model of another module `Link<Target>`",
        );
      return undefined;
    }
    const back = decorator?.args[1];
    const inverse =
      back !== undefined && host.kind(back) === "ArrowFunction" && back.body?.name !== undefined
        ? nameOf(back.body.name)
        : undefined;
    const written = decorator?.args
      .slice(1)
      .find((argument) => host.kind(argument) === "ObjectLiteralExpression");
    const targetModule =
      isOwn(host.fileName(targetClass)) && kindInfo(targetClass)?.kind === "model"
        ? moduleOf(host.fileName(targetClass))
        : undefined;
    return {
      name,
      kind,
      target: refOf(targetNode, targetSymbol),
      ...(targetModule !== undefined ? { targetModule } : {}),
      nullable: members.some(isNullish),
      ref: typeName === "Ref",
      ...(inverse !== undefined ? { inverse } : {}),
      options: optionsOf(written),
    };
  };

  /** A model's entity facts: `[OptionalProps]` keys, relations and public getters, over its whole chain. */
  const entityOf = (
    shape: string,
    chain: readonly TsNode[],
    relations: readonly string[],
    traitFields: readonly string[],
  ): EntityIR => {
    // Base-most first, as `fieldsOf` reads a chain: a base's declaration holds the decorators.
    const baseFirst = chain.reduceRight<TsNode[]>((links, link) => [...links, link], []);
    const properties = baseFirst.flatMap(propertiesOf);
    const declarations = new Map<string, TsNode>();
    for (const property of properties)
      if (!declarations.has(nameOf(property.name)))
        declarations.set(nameOf(property.name), property);
    const initialized = properties
      .filter((property) => property.initializer !== undefined)
      .map((property) => nameOf(property.name));
    const getters = baseFirst
      .flatMap((link) => link.members ?? [])
      .filter(
        (member) =>
          host.kind(member) === "GetAccessor" &&
          kindOf(member.name) === "Identifier" &&
          !has(member, "StaticKeyword") &&
          !has(member, "PrivateKeyword") &&
          !has(member, "ProtectedKeyword"),
      )
      .map((member) => nameOf(member.name));
    return {
      optional: [...new Set([...traitFields, ...initialized])].sort(),
      relations: relations.flatMap((name) => {
        const declaration = declarations.get(name);
        const relation = declaration === undefined ? undefined : relationOf(shape, declaration);
        return relation === undefined ? [] : [relation];
      }),
      computed: [...new Set(getters)],
    };
  };

  // Shapes, cached so a derived shape reads its source once.
  const shapeCache = new Map<TsNode, ShapeIR | null>();
  const readShape = (node: TsNode): ShapeIR | undefined => {
    const cached = shapeCache.get(node);
    if (cached !== undefined) return cached ?? undefined;
    const shape = buildShape(node);
    shapeCache.set(node, shape ?? null);
    return shape;
  };
  const buildShape = (node: TsNode): ShapeIR | undefined => {
    const name = nameOf(node.name);
    const info = kindInfo(node);
    if (name === "" || info === undefined || !SHAPE_KINDS.includes(info.kind)) return undefined;
    if (info.kind === "config" && (info.base === undefined || info.base.own)) return undefined;
    const path = host.fileName(node);
    const head = {
      name,
      kind: info.kind,
      module: moduleOf(path),
      file: rel(path),
      importPath: importPathOf(path),
    };
    const heritage = heritageOf(node);

    if (info.base !== undefined && !info.base.own && info.kind === "config") {
      const { fields, relations } = fieldsOf(name, info.chain, node);
      return {
        ...head,
        base: { kind: "package", name: info.base.name, from: info.base.from },
        fields,
        relations,
      };
    }
    const baseNode = info.chain[1];
    if (info.base?.own === true && baseNode !== undefined && readShape(baseNode) !== undefined) {
      const { fields, relations } = fieldsOf(name, info.chain, node);
      return {
        ...head,
        base: { kind: "member", name: info.base.name, module: moduleOf(host.fileName(baseNode)) },
        fields,
        relations,
      };
    }
    if (info.derive !== undefined) {
      const source = kindInfo(info.derive.from);
      const inherited =
        source === undefined
          ? { fields: [], relations: [] }
          : fieldsOf(nameOf(info.derive.from.name), source.chain);
      const keys = new Set(info.derive.keys);
      const picked = inherited.fields
        .filter((field) =>
          info.derive?.helper === "PickType"
            ? keys.has(field.name)
            : info.derive?.helper === "OmitType"
              ? !keys.has(field.name)
              : true,
        )
        .map((field) =>
          info.derive?.helper === "PartialType" ? { ...field, optional: true } : field,
        );
      const own = fieldsOf(name, [node]);
      const names = new Set(own.fields.map((field) => field.name));
      return {
        ...head,
        fields: [...picked.filter((field) => !names.has(field.name)), ...own.fields],
        relations: own.relations,
      };
    }
    const { fields, relations } = fieldsOf(name, info.chain);
    if (heritage?.method === "of" && heritage.call !== undefined) {
      // Page.of(Item): `{ items: Item[]; nextCursor?: string; hasMore: boolean }` (@stackra/validation).
      const argument = heritage.call.arguments?.[0];
      const itemSymbol = argument === undefined ? undefined : host.symbolAt(argument);
      const itemClass = classDeclarationOf(itemSymbol);
      const element: TypeDesc =
        itemSymbol !== undefined && itemClass !== undefined && isOwn(host.fileName(itemClass))
          ? {
              kind: "schema",
              name: host.symbolName(itemSymbol),
              module: moduleOf(host.fileName(itemClass)),
            }
          : unknownType(
              node,
              `${name}.items`,
              false,
              "the item of Page.of(...) is not a schema of this member",
              "page a Schema class declared in this member",
            );
      fields.unshift(
        {
          name: "items",
          optional: false,
          nullable: false,
          type: { kind: "array", element },
          rules: [],
        },
        {
          name: "nextCursor",
          optional: true,
          nullable: false,
          type: { kind: "string" },
          rules: [],
        },
        { name: "hasMore", optional: false, nullable: false, type: { kind: "boolean" }, rules: [] },
      );
    }
    if (info.kind === "model" && node.name !== undefined) {
      // Trait fields come from `Model.with(...)` mixins: their declarations are generic, so the checker types them.
      const declared = new Set([...fields.map((field) => field.name), ...relations]);
      const traitFields: string[] = [];
      for (const property of host.properties(host.typeAt(node.name))) {
        const propertyName = host.symbolName(property);
        const declaration = host.declarations(property)[0];
        if (
          declared.has(propertyName) ||
          !host.symbolHas(property, "Property") ||
          declaration === undefined
        )
          continue;
        if (!isStackra(host.fileName(declaration)) || propertyName.startsWith("~")) continue;
        const { type, nullable } = readChecker(
          host.typeOfSymbol(property),
          node.name,
          `${name}.${propertyName}`,
          true,
        );
        fields.push({
          name: propertyName,
          optional: host.symbolHas(property, "Optional"),
          nullable,
          type,
          rules: [],
        });
        traitFields.push(propertyName);
      }
      return {
        ...head,
        fields,
        relations,
        entity: entityOf(name, info.chain, relations, traitFields),
      };
    }
    return { ...head, fields, relations };
  };

  /** The partner named by the heritage type argument, or by the value argument of `Driver(Port)` and `Widget.place`. */
  const partnerOf = (node: TsNode, kind: string, heritage: Heritage): DeclaredClass["partner"] => {
    const subject = nameOf(node.name);
    const first = heritage.typeArguments[0];
    let target: TsNode | undefined;
    let slot: string | undefined;
    if (first !== undefined) {
      target = first;
      if (host.kind(first) === "IndexedAccessType" && first.objectType !== undefined) {
        target = first.objectType;
        slot = nameOf(first.indexType?.literal);
      }
      target = target.typeName ?? target;
    } else if (kind === "driver" || heritage.method === "place")
      target = heritage.call?.arguments?.[0];
    if (target === undefined) return undefined;
    const symbol = host.symbolAt(target);
    if (symbol === undefined) return undefined;
    const declarations = host.declarations(symbol);
    if (declarations.some((declaration) => host.kind(declaration) === "TypeAliasDeclaration")) {
      fail(
        target,
        subject,
        "partner_mismatch",
        `the type argument \`${host.text(target)}\` names a type alias`,
        "name the partner class itself, not an alias of it",
      );
      return undefined;
    }
    const declaration = classDeclarationOf(symbol);
    const partnerKind = declaration === undefined ? undefined : kindInfo(declaration)?.kind;
    return {
      name: host.symbolName(symbol),
      ...(partnerKind !== undefined ? { kind: partnerKind } : {}),
      ...(slot !== undefined && slot !== "" ? { slot } : {}),
      from: refOf(target, symbol).from,
    };
  };

  /** The partner rules gen can check from the class alone (ADR 0305 rules 6 and 7, ADR 0308 rule 15). */
  const checkPartner = (
    node: TsNode,
    kind: string,
    partner: DeclaredClass["partner"],
    options: Readonly<Record<string, unknown>>,
  ): void => {
    const name = nameOf(node.name);
    const at = node.name ?? node;
    if (partner === undefined) return;
    if (
      kind === "policy" &&
      options["permissions"] === undefined &&
      partner.name !== name.replace(/Policy$/, "")
    )
      fail(
        at,
        name,
        "partner_mismatch",
        `${name} is typed against ${partner.name}, so it cannot find its permissions by stem`,
        `name it ${partner.name}Policy, or pass \`{ permissions: ${partner.name}Permissions }\``,
      );
    if (kind === "connection" && partner.name !== `${name.replace(/Connection$/, "")}Integration`)
      fail(
        at,
        name,
        "partner_mismatch",
        `${name} is typed against ${partner.name}, not ${name.replace(/Connection$/, "")}Integration`,
        "name the connection after its integration",
      );
    if (kind === "webhook_event" && partner.kind !== undefined && partner.kind !== "integration")
      fail(
        at,
        name,
        "partner_mismatch",
        `the type argument of a WebhookEvent must be an Integration, not a ${partner.kind}`,
        "type the event against the Integration that verifies it",
      );
    if (kind === "extension" && partner.slot === undefined)
      fail(
        at,
        name,
        "partner_mismatch",
        "an extension names one slot of its point",
        `write \`Extension<${partner.name}["slotName"]>({ order })\``,
      );
  };

  const tokenOf = (parameter: TsNode, owner: string): TokenRef | undefined => {
    const type = parameter.type;
    const subject = `${owner}.constructor`;
    const refuse = (): undefined => {
      fail(
        parameter,
        subject,
        "token_not_a_class",
        `the parameter \`${host.text(parameter)}\` is not typed with a class`,
        'type each constructor parameter with the class (or port) to inject, or `Named<Port, "x">`',
      );
      return undefined;
    };
    if (type === undefined || host.kind(type) !== "TypeReference" || type.typeName === undefined)
      return refuse();
    // A generated service client is a class token by its import, before gen has written its file (ADR 0260 d3).
    const specifier = importsOf(host.fileName(parameter)).get(nameOf(type.typeName));
    if (specifier?.startsWith(CLIENTS_SPECIFIER) === true)
      return { class: { name: nameOf(type.typeName), from: specifier } };
    const symbol = host.symbolAt(type.typeName);
    if (symbol === undefined) return refuse();
    const declaration = host.declarations(symbol)[0];
    // `Repository<M>` and `Journal<M>`: a per-model token, `repositoryOf(M)` or `journalOf(M)`.
    const generic = MODEL_TOKENS[host.symbolName(symbol)];
    if (
      generic !== undefined &&
      declaration !== undefined &&
      packageOf(host.fileName(declaration)) === generic.package
    ) {
      const model = type.typeArguments?.[0];
      const modelSymbol = model?.typeName === undefined ? undefined : host.symbolAt(model.typeName);
      if (
        model === undefined ||
        modelSymbol === undefined ||
        classDeclarationOf(modelSymbol) === undefined
      )
        return refuse();
      return { class: refOf(model.typeName ?? model, modelSymbol), of: generic.factory };
    }
    if (
      host.symbolName(symbol) === "Named" &&
      declaration !== undefined &&
      isStackra(host.fileName(declaration))
    ) {
      const [port, instance] = type.typeArguments ?? [];
      const portSymbol = port?.typeName === undefined ? undefined : host.symbolAt(port.typeName);
      if (port === undefined || portSymbol === undefined || instance?.literal === undefined)
        return refuse();
      return { class: refOf(port.typeName ?? port, portSymbol), named: nameOf(instance.literal) };
    }
    if (classDeclarationOf(symbol) === undefined) return refuse();
    return { class: refOf(type.typeName, symbol) };
  };

  // `ReplicaPage` (or `ReplicaPage<T>`) from a Stackra package: a replica query's answer (ADR 0338 decision 3).
  const isReplicaPage = (type: TsNode): boolean => {
    if (host.kind(type) !== "TypeReference" || type.typeName === undefined) return false;
    const symbol = host.symbolAt(type.typeName);
    const declaration = symbol === undefined ? undefined : host.declarations(symbol)[0];
    return (
      symbol !== undefined &&
      host.symbolName(symbol) === "ReplicaPage" &&
      declaration !== undefined &&
      isStackra(host.fileName(declaration))
    );
  };

  // A listener's subscription: the event class its `handle` parameter is typed with (ADR 0260 decision 4).
  const listenerHandleOf = (node: TsNode): DeclaredClass["handle"] => {
    const name = nameOf(node.name);
    const handle = (node.members ?? []).find(
      (member) => host.kind(member) === "MethodDeclaration" && nameOf(member.name) === "handle",
    );
    if (handle === undefined) return undefined; // the abstract `handle` already fails to compile
    const parameter = handle.parameters?.[0];
    const type = parameter?.type;
    const refuse = (): undefined => {
      fail(
        parameter ?? handle,
        name,
        "listener_handle_signature",
        "the first parameter of `handle` is not typed with an event class",
        "type it with the event class to react to (yours, or one from #stackra/clients/<service>), or " +
          "`EventEnvelope` from @stackra/outbox/contracts for a relay of every event",
      );
      return undefined;
    };
    if (type === undefined || host.kind(type) !== "TypeReference" || type.typeName === undefined)
      return refuse();
    // A consumed service's event is a class by its import, before gen has written the client file.
    const specifier = importsOf(host.fileName(handle)).get(nameOf(type.typeName));
    if (specifier?.startsWith(CLIENTS_SPECIFIER) === true)
      return { event: { name: nameOf(type.typeName), from: specifier } };
    const symbol = host.symbolAt(type.typeName);
    if (symbol === undefined) return refuse();
    const declaration = host.declarations(symbol)[0];
    if (
      host.symbolName(symbol) === "EventEnvelope" &&
      declaration !== undefined &&
      packageOf(host.fileName(declaration)) === "@stackra/outbox"
    )
      return { relay: true };
    if (classDeclarationOf(symbol) === undefined) return refuse();
    return { event: refOf(type.typeName, symbol) };
  };

  const handleOf = (node: TsNode, kind: string): DeclaredClass["handle"] => {
    if (kind === "listener") return listenerHandleOf(node);
    if (kind !== "action" && kind !== "query") return undefined;
    const name = nameOf(node.name);
    const fix =
      "declare `async handle(input: XInput, ctx): Promise<XOutput>` with Schema classes from schemas/ " +
      "(a replica query answers `Promise<ReplicaPage>`)";
    const handle = (node.members ?? []).find(
      (member) => host.kind(member) === "MethodDeclaration" && nameOf(member.name) === "handle",
    );
    if (handle === undefined) {
      fail(
        node.name ?? node,
        name,
        "action_handle_signature",
        `${name} has no \`handle\` method`,
        fix,
      );
      return undefined;
    }
    const parameter = handle.parameters?.[0];
    const input = shapeClassAt(parameter?.type);
    if (parameter?.type !== undefined && input === undefined)
      fail(
        parameter,
        name,
        "action_handle_signature",
        "the input of `handle` is not a schema of this member",
        fix,
      );
    const returns = handle.type;
    let output: string | undefined;
    let replica = false;
    if (
      returns === undefined ||
      host.kind(returns) !== "TypeReference" ||
      nameOf(returns.typeName) !== "Promise"
    )
      fail(
        handle.name ?? handle,
        name,
        "action_handle_signature",
        "`handle` must declare its return type as Promise<Output>",
        fix,
      );
    else {
      const inner = returns.typeArguments?.[0];
      if (inner !== undefined && host.kind(inner) !== "VoidKeyword") {
        replica = isReplicaPage(inner);
        output = replica ? undefined : shapeClassAt(inner)?.name;
        if (output === undefined && !replica)
          fail(
            inner,
            name,
            "action_handle_signature",
            "the output of `handle` is not a schema of this member",
            fix,
          );
      }
    }
    return {
      ...(input !== undefined ? { input: input.name } : {}),
      ...(output !== undefined ? { output } : {}),
      ...(replica ? { replica: true as const } : {}),
    };
  };

  const readClass = (node: TsNode): DeclaredClass | undefined => {
    const name = nameOf(node.name);
    const info = name === "" ? undefined : kindInfo(node);
    if (info === undefined) return undefined;
    const path = host.fileName(node);
    if (info.kind === "event")
      fail(
        node.name ?? node,
        name,
        "event_base_abstract",
        "`Event` is the abstract base of the four event kinds",
        "extend DomainEvent, IntegrationEvent, WebhookEvent or AnalyticsEvent",
      );
    const heritage = heritageOf(node) as Heritage;
    const direct = info.chain.length === 1;
    const optionsArgument =
      !direct ||
      heritage.call === undefined ||
      heritage.method === "with" ||
      heritage.method === "of"
        ? undefined
        : info.kind === "driver" || heritage.method === "place"
          ? heritage.call.arguments?.[1]
          : heritage.call.arguments?.[0];
    const options = optionsOf(optionsArgument);
    const partner = partnerOf(node, info.kind, heritage);
    checkPartner(node, info.kind, partner, options);

    const members = node.members ?? [];
    const constructor = members.find((member) => host.kind(member) === "Constructor");
    const deps = (constructor?.parameters ?? [])
      .map((parameter) => tokenOf(parameter, name))
      .filter((token): token is TokenRef => token !== undefined);

    const facets: FacetUse[] = [];
    let lifetime: string | undefined;
    let renamed: string | undefined;
    for (const use of decoratorsOf(node)) {
      if (use.name === "Lifetime") {
        const value = constant(use.args[0]);
        if (typeof value === "string") lifetime = value;
      }
      if (use.name === "Renamed") {
        const value = constant(use.args[0]);
        if (typeof value === "string") renamed = value;
      }
      const facet = facetOf(use, "class");
      if (facet !== undefined) facets.push(facet);
    }
    for (const member of members) {
      const kind = host.kind(member);
      if (kind !== "PropertyDeclaration" && kind !== "MethodDeclaration") continue;
      for (const use of decoratorsOf(member)) {
        const facet = facetOf(
          use,
          kind === "MethodDeclaration" ? "method" : "field",
          nameOf(member.name),
        );
        if (facet !== undefined) facets.push(facet);
      }
    }

    const methods = members
      .filter(
        (member) =>
          host.kind(member) === "MethodDeclaration" &&
          kindOf(member.name) === "Identifier" &&
          !has(member, "StaticKeyword") &&
          !has(member, "PrivateKeyword") &&
          !has(member, "ProtectedKeyword"),
      )
      .map((member) => nameOf(member.name));

    const body = host.text(node);
    const refusals = new Set<string>();
    for (const match of body.matchAll(
      /\bnew\s+([A-Z]\w*Error)\s*\(|\b([A-Z]\w*Error)\s*\.\s*create\s*\(/g,
    )) {
      const refusal = match[1] ?? match[2];
      if (refusal === undefined || !isRefusal(path, refusal)) continue;
      try {
        refusals.add(refusalCode(refusal));
      } catch {
        // an invalid refusal name is reported on the refusal's own class by the manifest
      }
    }
    if (/\.authorize\s*\(/.test(body)) refusals.add("forbidden");

    const statics: Record<string, string> = {};
    for (const member of members)
      if (
        host.kind(member) === "PropertyDeclaration" &&
        has(member, "StaticKeyword") &&
        member.initializer !== undefined
      )
        statics[nameOf(member.name)] = host.text(member.initializer);

    const traits =
      direct && heritage.method === "with"
        ? (heritage.call?.arguments ?? []).map((argument) =>
            host.kind(argument) === "CallExpression"
              ? {
                  name: argument.expression === undefined ? "" : host.text(argument.expression),
                  args: (argument.arguments ?? []).map((value) => {
                    const evaluated = constant(value);
                    return hasNonConstant(evaluated) ? null : evaluated;
                  }),
                }
              : { name: host.text(argument), args: [] },
          )
        : [];

    const handle = handleOf(node, info.kind);
    return {
      name,
      kind: info.kind,
      module: moduleOf(path),
      file: rel(path),
      importPath: importPathOf(path),
      options,
      ...(partner !== undefined ? { partner } : {}),
      ...(info.base !== undefined ? { base: info.base } : {}),
      deps,
      ...(lifetime !== undefined ? { lifetime } : {}),
      facets,
      methods,
      ...(handle !== undefined ? { handle } : {}),
      refusals: [...refusals],
      statics,
      traits,
      ...(renamed !== undefined ? { renamed } : {}),
    };
  };

  const classNodes = (file: TsNode): TsNode[] =>
    (file.statements ?? []).filter(
      (statement) => host.kind(statement) === "ClassDeclaration" && statement.name !== undefined,
    );

  return {
    sources,
    errors,
    classes: (file) =>
      classNodes(file)
        .map(readClass)
        .filter((found): found is DeclaredClass => found !== undefined),
    shapes: (file) =>
      classNodes(file)
        .map(readShape)
        .filter((found): found is ShapeIR => found !== undefined),
    enums: (file) => {
      const found: EnumIR[] = [];
      const path = file.fileName ?? "";
      for (const statement of file.statements ?? []) {
        if (host.kind(statement) !== "VariableStatement") continue;
        for (const declaration of statement.declarationList?.declarations ?? []) {
          const init = declaration.initializer;
          if (
            init === undefined ||
            host.kind(init) !== "CallExpression" ||
            init.expression === undefined
          )
            continue;
          if (host.text(init.expression) !== "Enum.of" || declaration.name === undefined) continue;
          const described = enumOf(host.symbolAt(declaration.name));
          if (described?.kind === "enum")
            found.push({
              name: nameOf(declaration.name),
              module: moduleOf(path),
              file: rel(path),
              values: described.values,
            });
        }
      }
      return found;
    },
    exports: (file) => {
      const path = file.fileName ?? "";
      const names = new Map<string, boolean>();
      const record = (name: string, typeOnly: boolean): void => {
        names.set(name, typeOnly && (names.get(name) ?? true));
      };
      for (const statement of file.statements ?? []) {
        if (!has(statement, "ExportKeyword") || has(statement, "DefaultKeyword")) continue;
        const kind = host.kind(statement);
        if (kind === "VariableStatement")
          for (const declaration of statement.declarationList?.declarations ?? [])
            record(nameOf(declaration.name), false);
        else if (kind === "InterfaceDeclaration" || kind === "TypeAliasDeclaration")
          record(nameOf(statement.name), true);
        else if (statement.name !== undefined) record(nameOf(statement.name), false);
      }
      const isIndex = /\/index\.tsx?$/.test(path);
      if (names.size > 1 && !isIndex)
        fail(
          file,
          rel(path),
          "two_declarations_in_file",
          `the file exports ${names.size} declarations: ${[...names.keys()].join(", ")}`,
          "move each declaration to its own file (an enum's const and its same-named type count as one)",
        );
      const parts = rel(path).split("/");
      return {
        file: rel(path),
        importPath: importPathOf(path),
        folder: parts.length > 2 ? (parts[1] ?? "") : "",
        names: [...names].map(([name, typeOnly]) => ({ name, typeOnly })),
      };
    },
  };
}
