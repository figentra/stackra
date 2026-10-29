/**
 * Stackra file contract:
 * Purpose: `createSourceReader`, discovery's analyser over one opened program: it reads each class's kind from the
 *          base its `extends` clause names (bare, called, `Model.with`, `Page.of`, `Widget.place`, an own or a
 *          package class), its options as constants (a class thunk, `counts: () => Till`, as its class), its partner from the heritage type argument (`Point["slot"]`
 *          included; the value argument of `Driver(Port)`, `Widget.place` and `ModelAddition(Base)`, ADR 0336), its constructor tokens, facets, `handle` signature (a `ReplicaPage` output from a `@stackra/*`
 *          package reads as `replica`, ADR 0338; a listener's parameter is its event class, one from
 *          `#stackra/clients/<service>` by its import, or `EventEnvelope` from `@stackra/outbox` as a relay), refusals, statics and traits; each shape's fields from the declared
 *          type node first and the checker second, with rules and constant defaults; each model's entity facts
 *          (`[OptionalProps]` keys, relations with their target, inverse and options, getters); each `Enum.of` in
 *          source order; each file's exports; and the services any own file (tests included) imports from
 *          `#stackra/clients/<service>`.
 * Boundary: syntax-first and backend-neutral: every question goes through `TsHost`. Only the member's own source
 *           files under `src/` are read as declarations; a dependency is read only to resolve a kind, an inherited
 *           field or a constant, and its options never (ADR 0294 decision 25). A `@Field(zod)` hatch carries the named imports its source uses. Every refusal is collected with its
 *           fix; nothing throws on bad source. Files are sorted by path so output never follows the import graph.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 16, 17, 20, 25 and 26); ADR 0305 (rules 1, 5 to 13, 19 and 42 to 46); the
 *                     STA-335 type-to-schema and STA-409 partner spikes; ADR 0260 (decision 3: a parameter typed with a
 *                     `#stackra/clients/<service>` client is its class token; decision 4: a listener subscribes to the event class
 *                     its `handle` parameter imports, never to a wire name); ADR 0162 (decision 2: `Translated` and
 *                     `TranslatedStrings` read as the `translated` kind); ADR 0222 (decision 2: `Upload<Bucket>` reads as
 *                     the `upload` kind, its argument a Bucket class); ADR 0294 amendment 2026-10-26 (STA-1283: a bare or
 *                     prefix-union `PublicId`, `Readonly<Record>`, regex constants, `Translated.of`, `this.<field>`
 *                     spreads in a default, a trailing `tool: false, // reason:`); STA-1290 (a field typed with a
 *                     `@stackra/*` class, interface, alias or union whose package ships `X$` reads as `shipped`);
 *                     STA-1296 (a package config override reads its fields' type and `this.<field>` default from the
 *                     base's `Config({ schema })` options class; `Object.freeze`, shared constants and `I18n` keys
 *                     read as constants; a shipped `X$` of a declared package not in the program is still found);
 *                     STA-1306 (`kind_base_name_reserved`, `secret_name_missing`, `partner_mismatch` for every
 *                     same-stem kind, and each file's exported class names for `kind_unregistered_base`);
 *                     STA-1251 (a `@Classify(Class)` facet carries its data class's constant effects as
 *                     `options.dataClass`, read from the `DataClass({...})` its chain extends, own or a package's);
 *                     ADR 0438 (each exported `defineSlot<P>` and `fillSlot` of `@stackra/panel`: options as
 *                     constants, the slot's `props` type as a record, the fill's slot by its import;
 *                     `slot_options_not_constant`); STA-1363 (`remoteShape` of `@stackra/clients` is a schema base whose
 *                     derived or extending shapes take a `remote` base; `Settings.pick` of `#stackra/settings` is a
 *                     schema kind; a default naming a missing enum case is `shape_default_member_unresolved`); stackra-209
 *                     (a `Settings.pick([...])` class compiles over the picked keys of the member's own settings classes,
 *                     `settings_key_unresolved` otherwise); STA-1365 (as the `base-matches-suffix` lint: a class extending
 *                     an `…Error` in an `.error.ts` file, a base-less class in a `src/testing/` `.service.ts` file and a
 *                     class under an `oxlint-disable-next-line stackra/base-matches-suffix -- reason:` line are left out of
 *                     a file's exported classes, so never `kind_unregistered_base`; an abstract class is a kind base,
 *                     never `event_base_abstract`, and is never built, so its constructor is not read and it is marked
 *                     `abstract` (never a driver candidate); a class without
 *                     a constructor takes the nearest one its chain declares; a port-kind class in a `.driver.ts` file of
 *                     a package below the container is built by hand, so its constructor is not read; `I18nKey` of a
 *                     `@stackra/*` package reads as the `i18n_key` brand, a string).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { refusalCode } from "@stackra/errors";
import { snakeCase } from "@stackra/support";

import { BELOW_CONTAINER_PACKAGES } from "#core/constants/below-container-packages.constant";
import { CLIENTS_SPECIFIER } from "#core/constants/clients-specifier.constant";
import { MODEL_TOKENS } from "#core/constants/model-tokens.constant";
import { folderKey } from "#core/functions/folder-key.function";
import { platformConstant } from "#core/functions/platform-constant.function";
import { publicSpecifier } from "#core/functions/public-specifier.function";
import { shippedSpecifier } from "#core/functions/shipped-specifier.function";
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
import type { SlotFillIR } from "#core/types/slot-fill-ir.type";
import type { SlotIR } from "#core/types/slot-ir.type";
import type { TokenRef } from "#core/types/token-ref.type";
import type { TypeDesc } from "#core/types/type-desc.type";
import { KIND_BASES } from "#node/constants/kind-bases.constant";
import { NOT_CONSTANT } from "#node/constants/not-constant.constant";
import { RELATION_TYPES } from "#node/constants/relation-types.constant";
import { SHAPE_DECORATORS } from "#node/constants/shape-decorators.constant";
import { SHAPE_KINDS } from "#node/constants/shape-kinds.constant";
import type { MemberFacts } from "#node/types/member-facts.type";
import type { SourceReader } from "#node/types/source-reader.type";
import type { TsHost } from "#node/types/ts-host.type";
import type { TsSymbol } from "#node/types/ts-symbol.type";
import type { TsType } from "#node/types/ts-type.type";
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
  /** A consumed shape: the class extends `remoteShape(...)` of `@stackra/clients`, its fields in its `schema` static. */
  readonly remote?: true;
  /** `Settings.pick([...])` of `#stackra/settings`: a schema whose fields are the picked setting keys (STA-1363). */
  readonly settingsPick?: true;
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

/** A secret name: SCREAMING_SNAKE words, as `@Secret` of `@stackra/config` checks it. */
const SECRET_NAME = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;

/** The kinds typed against their same-stem subject (`OrderResource` is `Resource<Order>`), with their class suffix. */
const STEM_PARTNERED: Readonly<Record<string, string>> = {
  facts: "Facts",
  factory: "Factory",
  resource: "Resource",
  state_machine: "StateMachine",
};

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
  /^(Duration\.(seconds|minutes|hours|days|parse)|Money\.(of|ofMinor|zero)|Translated\.of)$/;

/** How a field initializer reads `this.<name>`: the value an earlier initializer in the chain gave it. */
type SelfOf = (name: string) => unknown;

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

/** The lint's own exemption written above a class: `// oxlint-disable-next-line stackra/base-matches-suffix -- reason: …`. */
const BASE_LINT_DISABLED =
  /^\s*\/\/\s*oxlint-disable-next-line\s.*\bstackra\/base-matches-suffix\b.*--\s*reason:\s*\S/;

/** A `.service.ts` file of a package's testing entry: its base-less classes are harnesses, never bindings (lint `TESTING_ENTRY`). */
const TESTING_HARNESS = /(?:^|\/)src\/testing\/(?:.*\/)?[^/]+\.service\.ts$/;

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

/** The `public_id` kind of the prefixes a `PublicId<…>` names: one prefix, a union of them, or any (none). */
function publicIdType(prefixes: readonly string[]): TypeDesc {
  return prefixes.length === 1
    ? { kind: "public_id", prefix: prefixes[0] as string }
    : { kind: "public_id", prefix: "", ...(prefixes.length > 1 ? { prefixes } : {}) };
}

/** Whether a constant is a plain object: not an array, a class reference or a regular expression. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !("$class" in value) &&
    !("$regex" in value)
  );
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
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    .sort((left, right) => ((left.fileName ?? "") < (right.fileName ?? "") ? -1 : 1));

  const rel = (path: string): string =>
    path.startsWith(`${root}/`) ? path.slice(root.length + 1) : path;
  const kindOf = (node: TsNode | undefined): string => (node === undefined ? "" : host.kind(node));
  const nameOf = (node: TsNode | undefined): string =>
    node?.text ?? (node === undefined ? "" : host.text(node));
  const has = (node: TsNode, modifier: string): boolean =>
    (node.modifiers ?? []).some((candidate) => host.kind(candidate) === modifier);

  // Packages (name and root folder) by directory, for "is this declared in a @stackra package".
  type PackageAt = { readonly name: string | undefined; readonly root: string } | undefined;
  const packages = new Map<string, PackageAt>();
  const packageAt = (path: string): PackageAt => {
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
        const found = { name, root: directory };
        for (const seen of visited) packages.set(seen, found);
        return found;
      }
      const parent = dirname(directory);
      if (parent === directory) {
        for (const seen of visited) packages.set(seen, undefined);
        return undefined;
      }
      directory = parent;
    }
  };
  const packageOf = (path: string): string | undefined => packageAt(path)?.name;
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

  /**
   * The named, unaliased imports of `path` that `source` uses, as `[name, specifier]`, or `[name, specifier, true]` for
   * a type-only one (`z.custom<RouteKey>(...)`), so the generated schema imports it as a type (a hatch's imports).
   */
  const importsUsedBy = (
    path: string,
    source: string,
  ): ([string, string] | [string, string, true])[] => {
    const used = new Set(
      [...source.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)/g)].map((match) => match[1]),
    );
    const found: ([string, string] | [string, string, true])[] = [];
    for (const statement of byPath.get(path)?.statements ?? []) {
      if (host.kind(statement) !== "ImportDeclaration") continue;
      const from = statement.moduleSpecifier?.text;
      const clause = statement.importClause;
      // shortcut: a relative, aliased, default or namespace import is not carried; hatches use `#` or package imports.
      if (from === undefined || from.startsWith(".") || clause === undefined) continue;
      for (const element of clause.namedBindings?.elements ?? []) {
        const name = nameOf(element.name);
        if (element.propertyName !== undefined || !used.has(name)) continue;
        found.push(
          clause.isTypeOnly === true || element.isTypeOnly === true
            ? [name, from, true]
            : [name, from],
        );
      }
    }
    return found;
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
  const constant = (node: TsNode | undefined, self?: SelfOf): unknown => {
    if (node === undefined) return NOT_CONSTANT;
    switch (host.kind(node)) {
      case "NumericLiteral": {
        return Number(nameOf(node).replaceAll("_", ""));
      }
      case "StringLiteral":
      case "NoSubstitutionTemplateLiteral": {
        return node.text ?? "";
      }
      case "TrueKeyword": {
        return true;
      }
      case "FalseKeyword": {
        return false;
      }
      case "NullKeyword": {
        return null;
      }
      case "RegularExpressionLiteral": {
        const raw = nameOf(node);
        const end = raw.lastIndexOf("/");
        return { $regex: raw.slice(1, end), flags: raw.slice(end + 1) };
      }
      case "PrefixUnaryExpression": {
        const value = constant(node.operand, self);
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
      case "TypeAssertionExpression": {
        return constant(node.expression, self);
      }
      case "ArrayLiteralExpression": {
        const items: unknown[] = [];
        for (const element of node.elements ?? []) {
          if (host.kind(element) !== "SpreadElement") {
            items.push(constant(element, self));
            continue;
          }
          // `[...this.levels, X]` in an override extends the base default (owner decisions 2026-10-26, round 3).
          const spread = constant(element.expression, self);
          if (!Array.isArray(spread)) return NOT_CONSTANT;
          items.push(...spread);
        }
        return items.some((item) => item === NOT_CONSTANT) ? NOT_CONSTANT : items;
      }
      case "ObjectLiteralExpression": {
        const entries: [string, unknown][] = [];
        for (const property of node.properties ?? []) {
          const kind = host.kind(property);
          if (kind === "PropertyAssignment") {
            const key = keyOf(property.name, self);
            if (key === undefined) return NOT_CONSTANT;
            entries.push([key, constant(property.initializer, self)]);
          } else if (kind === "ShorthandPropertyAssignment")
            entries.push([nameOf(property.name), constant(property.name, self)]);
          else if (kind === "SpreadAssignment") {
            // `{ ...this.errors, enabled: true }` in an override extends the base default (owner decisions round 3).
            const spread = constant(property.expression, self);
            if (!isPlainObject(spread)) return NOT_CONSTANT;
            entries.push(...Object.entries(spread));
          } else return NOT_CONSTANT;
        }
        return entries.some(([, value]) => value === NOT_CONSTANT)
          ? NOT_CONSTANT
          : Object.fromEntries(entries);
      }
      case "Identifier": {
        if (nameOf(node) === "undefined") return undefined;
        return reference(node);
      }
      case "PropertyAccessExpression": {
        if (node.expression !== undefined && host.kind(node.expression) === "ThisKeyword")
          return self === undefined ? NOT_CONSTANT : self(nameOf(node.name));
        return i18nKey(node) ?? reference(node);
      }
      case "CallExpression": {
        const callee = node.expression === undefined ? "" : host.text(node.expression);
        // `Object.freeze({ ... })` (a shared level constant) is the value it freezes (STA-1296).
        if (callee === "Object.freeze" && node.arguments?.length === 1)
          return constant(node.arguments[0], self);
        if (!PLATFORM_CALLEES.test(callee)) return NOT_CONSTANT;
        const args = (node.arguments ?? []).map((arg) => constant(arg, self));
        if (args.some((arg) => arg === NOT_CONSTANT)) return NOT_CONSTANT;
        try {
          return platformConstant(callee, args)?.value ?? NOT_CONSTANT;
        } catch {
          return NOT_CONSTANT;
        }
      }
      default: {
        return NOT_CONSTANT;
      }
    }
  };

  /**
   * `I18n.<namespace>.<path>` of `#stackra/i18n` as its key, `"<namespace>::<path>"` (the i18n target's contract), so a
   * default reads it before that target has written the file (STA-1296).
   */
  const i18nKey = (node: TsNode): string | undefined => {
    const path: string[] = [];
    let at: TsNode = node;
    while (kindOf(at) === "PropertyAccessExpression" && at.expression !== undefined) {
      path.unshift(nameOf(at.name));
      at = at.expression;
    }
    if (kindOf(at) !== "Identifier" || path.length < 2) return undefined;
    if (importsOf(host.fileName(node)).get(nameOf(at)) !== "#stackra/i18n") return undefined;
    const [namespace, ...rest] = path;
    return `${namespace}::${rest.join(".")}`;
  };

  /** The key of an object literal property: its name, or a computed key that is a constant string. */
  const keyOf = (name: TsNode | undefined, self?: SelfOf): string | undefined => {
    if (name === undefined || host.kind(name) !== "ComputedPropertyName") return nameOf(name);
    const key = constant(name.expression, self);
    return typeof key === "string" ? key : undefined;
  };

  /** A class, a static of a class, a literal-typed name, or a `const` holding a regular expression literal. */
  const reference = (node: TsNode): unknown => {
    const symbol = host.symbolAt(node);
    // A shared pattern (`export const METER_CODE = /^[a-z]+$/`) is a constant: patterns belong in a constants file.
    const variable = symbol === undefined ? undefined : host.valueDeclaration(symbol);
    if (
      variable?.initializer !== undefined &&
      host.kind(variable) === "VariableDeclaration" &&
      host.kind(variable.initializer) === "RegularExpressionLiteral"
    )
      return constant(variable.initializer);
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
    if (value !== undefined) return value;
    // A shared constant (`export const TENANT_SCOPE_LEVEL: ScopeLevel = Object.freeze({ ... })`) is its initializer's
    // value when that is a constant (STA-1296).
    // shortcut: a `let` binding reads the same as a `const`; lint bans exported `let`, so none reaches here in practice.
    return variable?.initializer !== undefined && host.kind(variable) === "VariableDeclaration"
      ? constant(variable.initializer)
      : NOT_CONSTANT;
  };

  /** The options object of a call argument: its constant properties, non-constant ones left out. */
  const optionsOf = (node: TsNode | undefined): Record<string, unknown> => {
    if (node === undefined || host.kind(node) !== "ObjectLiteralExpression") return {};
    const options: Record<string, unknown> = {};
    for (const property of node.properties ?? []) {
      const kind = host.kind(property);
      // A class thunk (`counts: () => Till`, so a model and its entitlement may import each other) reads as the
      // class it returns; any other function stays non-constant (STA-903).
      const thunk =
        kind === "PropertyAssignment" &&
        property.initializer !== undefined &&
        host.kind(property.initializer) === "ArrowFunction" &&
        (property.initializer.parameters ?? []).length === 0
          ? constant(property.initializer.body)
          : undefined;
      const value =
        typeof thunk === "object" && thunk !== null && "$class" in thunk
          ? thunk
          : kind === "PropertyAssignment"
            ? constant(property.initializer)
            : kind === "ShorthandPropertyAssignment"
              ? constant(property.name)
              : NOT_CONSTANT;
      const name = nameOf(property.name);
      if (!hasNonConstant(value)) options[name] = value;
      // ADR 0360 d4: `tool: false` carries its reason as a `// reason:` line, as `@Field(zod)` does.
      // A trailing `tool: false, // reason: …` counts too (owner decisions 2026-10-26, round 3).
      if (name === "tool" && value === false) {
        const reason = /\/\/\s*reason:\s*(.+)/
          .exec(`${host.leading(property)}\n${host.trailing(property)}`)?.[1]
          ?.trim();
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
    // Read by its import, so it is a schema before `#stackra/settings` is written (STA-1363).
    if (
      heritage.method === "pick" &&
      kindOf(heritage.target) === "Identifier" &&
      importsOf(host.fileName(node)).get(nameOf(heritage.target)) === "#stackra/settings"
    )
      return { kind: "schema", chain: [node], settingsPick: true };
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
    if (kind !== undefined && isStackra(path))
      return { kind, chain: [node], ...(name === "remoteShape" ? { remote: true as const } : {}) };
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
    // `@Classify(Class)` carries its data class's effects, so a check can read `ai` without the class (STA-1251).
    const effects = use.name === "Classify" ? dataClassOf(use.args[0]) : undefined;
    return {
      name: use.name,
      kind: snakeCase(use.name),
      target,
      ...(member !== undefined ? { member } : {}),
      options: hasNonConstant(value)
        ? undefined
        : effects === undefined || typeof value !== "object" || value === null
          ? value
          : { ...value, dataClass: effects },
      from: refOf(use.local, symbol).from,
    };
  };

  /**
   * The constant effects (`{ key, ai, support, search, export }`) of the data class `node` names: the argument of the
   * `DataClass({...})` from `@stackra/*` its chain extends; undefined when it is no data class or they are not constant.
   */
  const dataClassOf = (node: TsNode | undefined): Record<string, unknown> | undefined => {
    let declaration = classDeclarationOf(node === undefined ? undefined : host.symbolAt(node));
    for (const seen = new Set<TsNode>(); declaration !== undefined && !seen.has(declaration);) {
      seen.add(declaration);
      const heritage = heritageOf(declaration);
      const symbol = heritage === undefined ? undefined : host.symbolAt(heritage.target);
      if (heritage === undefined || symbol === undefined) return undefined;
      const [first] = host.declarations(symbol);
      if (
        host.symbolName(symbol) === "DataClass" &&
        first !== undefined &&
        isStackra(host.fileName(first))
      ) {
        const effects = constant(heritage.call?.arguments?.[0]);
        return isPlainObject(effects) && !hasNonConstant(effects) ? effects : undefined;
      }
      declaration = classDeclarationOf(symbol);
    }
    return undefined;
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
      ? // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
        { kind: "enum", name: host.symbolName(symbol), values: values.sort() }
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
      case "StringKeyword": {
        return { kind: "string" };
      }
      case "NumberKeyword": {
        return { kind: "number" };
      }
      case "BooleanKeyword": {
        return { kind: "boolean" };
      }
      case "ArrayType": {
        return node.elementType === undefined
          ? unknownType(node, subject, quiet)
          : { kind: "array", element: elementOf(node.elementType, subject, quiet) };
      }
      case "TypeOperator": {
        // `readonly T[]`
        return node.type === undefined
          ? unknownType(node, subject, quiet)
          : readSingleType(node.type, subject, quiet);
      }
      case "TypeQuery": {
        const value = host.literal(host.typeAt(node));
        return typeof value === "string"
          ? { kind: "enum", name: host.text(node).replace(/^typeof\s+/, ""), values: [value] }
          : unknownType(node, subject, quiet);
      }
      case "AnyKeyword": {
        return unknownType(node, subject, quiet, "`any` is not a shape type");
      }
      case "UnknownKeyword": {
        return unknownType(
          node,
          subject,
          quiet,
          "`unknown` is not a shape type",
          `${FIX_SHAPE}; free-form data is Json`,
        );
      }
      case "TypeLiteral": {
        return unknownType(
          node,
          subject,
          quiet,
          "an inline object type is not a shape type",
          "move the fields to a Schema class",
        );
      }
      case "LiteralType": {
        return unknownType(
          node,
          subject,
          quiet,
          `the literal type \`${host.text(node)}\` is not a shape type`,
          "use an enum (Enum.of)",
        );
      }
      case "TypeReference": {
        return readTypeReference(node, subject, quiet);
      }
      default: {
        return unknownType(node, subject, quiet);
      }
    }
  };

  /**
   * The prefixes a `PublicId<…>` type argument names: none for a bare `PublicId` or `PublicId<string>` (any prefix), one
   * for a literal, each member of a union of literals; undefined for any other argument.
   */
  const prefixesOf = (arg: TsNode | undefined): string[] | undefined => {
    if (arg === undefined || host.kind(arg) === "StringKeyword") return [];
    const members = host.kind(arg) === "UnionType" ? (arg.types ?? []) : [arg];
    const prefixes = members.map((member) =>
      host.kind(member) === "LiteralType" &&
      member.literal !== undefined &&
      host.kind(member.literal) === "StringLiteral"
        ? nameOf(member.literal)
        : undefined,
    );
    return prefixes.every((prefix): prefix is string => prefix !== undefined)
      ? prefixes
      : undefined;
  };

  // The `X$` schemas @stackra packages ship from their `.` and `./contracts` barrels: name to specifiers.
  let shippedIndex: Map<string, Set<string>> | undefined;
  const exportedNames = (file: TsNode): string[] =>
    (file.statements ?? []).flatMap((statement) => {
      const kind = host.kind(statement);
      if (kind === "ExportDeclaration" && statement.isTypeOnly !== true)
        return (statement.exportClause?.elements ?? [])
          .filter((element) => element.isTypeOnly !== true)
          .map((element) => nameOf(element.name));
      if (kind === "VariableStatement" && has(statement, "ExportKeyword"))
        return (statement.declarationList?.declarations ?? []).map((declaration) =>
          nameOf(declaration.name),
        );
      return [];
    });
  /** The `X$` names the `.` and `./contracts` barrels of package `name` export, read as text, by specifier. */
  const barrelsOnDisk = (name: string): [string, string[]][] => {
    let directory = root;
    let folder = join(directory, "node_modules", name);
    while (!existsSync(join(folder, "package.json"))) {
      const parent = dirname(directory);
      if (parent === directory) return [];
      directory = parent;
      folder = join(directory, "node_modules", name);
    }
    let exportsMap: Record<string, unknown>;
    try {
      const parsed = JSON.parse(readFileSync(join(folder, "package.json"), "utf8")) as {
        exports?: unknown;
      };
      exportsMap =
        typeof parsed.exports === "object" && parsed.exports !== null
          ? (parsed.exports as Record<string, unknown>)
          : {};
    } catch {
      return [];
    }
    const found: [string, string[]][] = [];
    for (const [entry, from] of [
      [".", name],
      ["./contracts", `${name}/contracts`],
    ] as const) {
      const target = exportsMap[entry];
      const conditions =
        typeof target === "object" && target !== null ? (target as Record<string, unknown>) : {};
      const file =
        typeof target === "string"
          ? target
          : (conditions["@stackra/source"] ?? conditions["types"]);
      if (typeof file !== "string") continue;
      const path = join(folder, file);
      if (byPath.has(path) || !existsSync(path)) continue;
      const text = readFileSync(path, "utf8");
      const names = [
        ...[...text.matchAll(/export\s+(?:declare\s+)?const\s+([\w$]+)/g)].map(
          (match) => match[1] ?? "",
        ),
        ...[...text.matchAll(/export\s*\{([^}]*)\}/g)].flatMap((match) =>
          (match[1] ?? "")
            .split(",")
            .map((element) => element.trim())
            .filter((element) => !element.startsWith("type "))
            .map((element) => element.split(/\s+as\s+/).pop() ?? ""),
        ),
      ].filter((exported) => exported.endsWith("$"));
      found.push([from, names]);
    }
    return found;
  };
  /** Where `<name>$` ships from: the type's own package first, else the first specifier in sort order. */
  const shippedOf = (name: string, typePath: string): string | undefined => {
    if (shippedIndex === undefined) {
      const index = new Map<string, Set<string>>();
      for (const file of all) {
        const path = file.fileName ?? "";
        const found = isOwn(path) ? undefined : packageAt(path);
        if (found?.name === undefined || !found.name.startsWith("@stackra/")) continue;
        const from = shippedSpecifier(found.name, path.slice(found.root.length + 1));
        if (from === undefined) continue;
        for (const exported of exportedNames(file)) {
          if (!exported.endsWith("$")) continue;
          index.set(exported, (index.get(exported) ?? new Set<string>()).add(from));
        }
      }
      // A declared package whose barrel the program never loaded (a member importing only @stackra/contracts still
      // finds `ScopeRef$` in @stackra/validation): its barrels are read from disk (STA-1296).
      for (const dependency of new Set([...facts.dependencies, "@stackra/validation"]))
        if (dependency.startsWith("@stackra/"))
          for (const [from, names] of barrelsOnDisk(dependency))
            for (const exported of names)
              index.set(exported, (index.get(exported) ?? new Set<string>()).add(from));
      shippedIndex = index;
    }
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    const candidates = [...(shippedIndex.get(`${name}$`) ?? [])].sort();
    const own = packageOf(typePath);
    return (
      candidates.find((from) => from === own || from.startsWith(`${own ?? ""}/`)) ?? candidates[0]
    );
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
      // `Readonly<Record<string, X>>` is the record it wraps.
      if (name === "Readonly" && args[0] !== undefined)
        return readSingleType(args[0], subject, quiet);
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
      if (name === "PublicId") {
        const prefixes = prefixesOf(args[0]);
        if (prefixes !== undefined) return publicIdType(prefixes);
      }
      if (name === "Money") return { kind: "money" };
      if (name === "Json") return { kind: "json" };
      if (name === "Duration") return { kind: "duration" };
      if (name === "Url") return { kind: "brand", brand: "url" };
      if (name === "Email") return { kind: "brand", brand: "email" };
      if (name === "CurrencyCode") return { kind: "brand", brand: "currency_code" };
      // A lang key is a string on the wire and in its column (STA-1365 item 7).
      if (name === "I18nKey") return { kind: "brand", brand: "i18n_key" };
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
      // A class, interface, alias or union whose package ships `X$` (STA-1290); a model or an enum keeps its route.
      const declared = classDeclarationOf(symbol);
      const from = shippedOf(name, path);
      if (
        from !== undefined &&
        (declared === undefined
          ? enumOf(symbol, node) === undefined
          : kindInfo(declared)?.kind !== "model")
      )
        return { kind: "shipped", name, from };
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
    ) {
      // The same reading as the type node: no literal (the `string` default) is any prefix, a union its prefixes.
      const [arg] = alias.args;
      const literals = (arg === undefined ? [] : (host.unionMembers(arg) ?? [arg])).map((member) =>
        host.literal(member),
      );
      const prefixes = literals.every((literal): literal is string => typeof literal === "string")
        ? literals
        : [];
      return { type: publicIdType(prefixes), nullable };
    }
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
        "add @Int for whole numbers or @Num for decimals above the field",
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
  const defaultOf = (
    init: TsNode,
    subject: string,
    quiet: boolean,
    self?: SelfOf,
  ): FieldDefault | undefined => {
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
      const args = (init.arguments ?? []).map((arg) => constant(arg, self));
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
    const value = constant(init, self);
    if (value === undefined) return undefined;
    // `QueryScope.ActiveScope` after the case was renamed: the owner resolves, the member does not (STA-1363).
    if (
      value === NOT_CONSTANT &&
      host.kind(init) === "PropertyAccessExpression" &&
      init.expression !== undefined &&
      host.kind(init.expression) !== "ThisKeyword" &&
      host.symbolAt(init) === undefined &&
      host.symbolAt(init.expression) !== undefined
    ) {
      if (!quiet) {
        const owner = host.text(init.expression);
        fail(
          init,
          subject,
          "shape_default_member_unresolved",
          `\`${owner}\` has no member \`${nameOf(init.name)}\``,
          `use a member ${owner} has (a case may have been renamed), or check its import`,
        );
      }
      return undefined;
    }
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
    self?: SelfOf,
  ): FieldRead => {
    const name = nameOf(declaration.name);
    const subject = `${shape}.${name}`;
    const decorators = decoratorsOf(declaration);
    if (decorators.some((use) => RELATIONS.has(use.name)) || isRelationType(declaration.type))
      return "relation";
    const hatch = decorators.find((use) => use.name === "Field");
    let type: TypeDesc;
    let nullable: boolean;
    if (hatch !== undefined) {
      if (!quiet && !/\/\/\s*reason:/.test(host.leading(declaration)))
        fail(
          hatch.node,
          subject,
          "shape_hatch_reason_missing",
          "@Field(zod) needs a reason",
          "add a `// reason: <why no type fits>` line above @Field",
        );
      const source = hatch.args[0] === undefined ? "z.unknown()" : host.text(hatch.args[0]);
      const imports = importsUsedBy(host.fileName(declaration), source);
      type = { kind: "hatch", source, ...(imports.length > 0 ? { imports } : {}) };
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
    // `@Secret` always names its secret, as a SCREAMING_SNAKE literal (ADR 0294 amendment 2, STA-1306).
    const secret = decorators.find((use) => use.name === "Secret");
    const secretName = secret?.args[0] === undefined ? undefined : constant(secret.args[0]);
    if (
      !quiet &&
      secret !== undefined &&
      (typeof secretName !== "string" || !SECRET_NAME.test(secretName))
    )
      fail(
        secret.node,
        subject,
        "secret_name_missing",
        "@Secret does not name its secret with a SCREAMING_SNAKE literal",
        'write `@Secret("<PROVIDER>_<PURPOSE>")`, such as `@Secret("RESEND_API_KEY")`; the value comes from the secret store',
      );
    const initial =
      value.initializer === undefined
        ? undefined
        : defaultOf(value.initializer, subject, quietDefault, self);
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

  /**
   * How the initializer of `field` in `chain[at]` reads `this.<name>`: the nearest initializer of `name` at or above
   * `chain[at]`, strictly above it for `field` itself (`override errors = { ...this.errors }` reads the base's).
   */
  const selfOf =
    (chain: readonly TsNode[], at: number, field: string): SelfOf =>
    (name) => {
      for (let index = name === field ? at + 1 : at; index < chain.length; index += 1) {
        const initializer = propertiesOf(chain[index] as TsNode).find(
          (property) => nameOf(property.name) === name,
        )?.initializer;
        if (initializer !== undefined) return constant(initializer, selfOf(chain, index, name));
      }
      return NOT_CONSTANT;
    };

  /** The fields of a chain (base-most declaration holds type and rules, most derived initializer is the default). */
  const fieldsOf = (
    shape: string,
    chain: readonly TsNode[],
    only?: TsNode,
  ): { fields: FieldIR[]; relations: string[] } => {
    const byName = new Map<string, { declaration: TsNode; value: TsNode; at: number }>();
    for (let index = chain.length - 1; index >= 0; index -= 1)
      for (const property of propertiesOf(chain[index] as TsNode)) {
        const name = nameOf(property.name);
        const entry = byName.get(name);
        if (entry === undefined)
          byName.set(name, { declaration: property, value: property, at: index });
        else if (property.initializer !== undefined) {
          entry.value = property;
          entry.at = index;
        }
      }
    const declaredHere =
      only === undefined
        ? undefined
        : new Set(propertiesOf(only).map((property) => nameOf(property.name)));
    const fields: FieldIR[] = [];
    const relations: string[] = [];
    for (const [name, { declaration, value, at }] of byName) {
      if (declaredHere !== undefined && !declaredHere.has(name)) continue;
      // A dependency's declaration is read for its type and rules but never reported on: the author cannot fix it.
      const field = readField(
        shape,
        declaration,
        value,
        !isOwn(host.fileName(declaration)),
        !isOwn(host.fileName(value)),
        selfOf(chain, at, name),
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
    // oxlint-disable-next-line unicorn/no-array-reverse -- reverses an array built here, which nothing else holds; toReversed is ES2023 and the base lib is ES2022
    const baseFirst = [...chain].reverse();
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
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      optional: [...new Set([...traitFields, ...initialized])].sort(),
      relations: relations.flatMap((name) => {
        const declaration = declarations.get(name);
        const relation = declaration === undefined ? undefined : relationOf(shape, declaration);
        return relation === undefined ? [] : [relation];
      }),
      computed: [...new Set(getters)],
    };
  };

  /**
   * A package config's chain with the options class of its `Config({ schema: X })` base appended: the base config
   * declares no fields, `X` does, so an override takes the field's type and rules from `X` and reads `this.<field>`
   * as `X`'s default (STA-1296).
   */
  const configChain = (chain: readonly TsNode[]): readonly TsNode[] => {
    const last = chain.at(-1);
    const options = last === undefined ? undefined : heritageOf(last)?.call?.arguments?.[0];
    if (options === undefined || host.kind(options) !== "ObjectLiteralExpression") return chain;
    const schema = (options.properties ?? []).find(
      (property) =>
        host.kind(property) === "PropertyAssignment" && nameOf(property.name) === "schema",
    )?.initializer;
    const declaration = classDeclarationOf(
      schema === undefined ? undefined : host.symbolAt(schema),
    );
    if (declaration === undefined) return chain;
    return [...chain, ...(kindInfo(declaration)?.chain ?? [declaration])];
  };

  /** The own shape class `name` of `module`, compiled. */
  const ownShape = (name: string, module: string): ShapeIR | undefined => {
    for (const file of sources)
      for (const node of classNodes(file))
        if (nameOf(node.name) === name && moduleOf(host.fileName(node)) === module)
          return readShape(node);
    return undefined;
  };

  /** The setting fields of `module`'s own settings classes by name, a section's fields under their own names. */
  const settingFieldsOf = (module: string): Map<string, FieldIR> => {
    const found = new Map<string, FieldIR>();
    for (const file of sources)
      for (const node of classNodes(file)) {
        const shape = kindInfo(node)?.kind === "settings" ? readShape(node) : undefined;
        if (shape === undefined || shape.module !== module) continue;
        for (const field of shape.fields)
          if (field.type.kind !== "schema") found.set(field.name, field);
          else
            for (const inner of ownShape(field.type.name, field.type.module)?.fields ?? [])
              found.set(inner.name, inner);
      }
    return found;
  };

  /**
   * The fields of a `Settings.pick([...])` class: each picked `Settings.<module>.<name>` key's field, read from the
   * member's own settings class of that module (stackra-209); undefined, with `settings_key_unresolved`, when a key is
   * not written as `Settings.<module>.<name>` or no own settings class declares it.
   */
  const pickedSettings = (node: TsNode, name: string): FieldIR[] | undefined => {
    const heritage = heritageOf(node);
    const list = heritage?.call?.arguments?.[0];
    const local = heritage === undefined ? "" : nameOf(heritage.target);
    const elements =
      list !== undefined && kindOf(list) === "ArrayLiteralExpression"
        ? (list.elements ?? [])
        : [list ?? node];
    const byModule = new Map<string, Map<string, FieldIR>>();
    const fields: FieldIR[] = [];
    for (const element of elements) {
      const [head, module, key, ...rest] = host.text(element).replaceAll(/\s+/g, "").split(".");
      let field: FieldIR | undefined;
      if (head === local && module !== undefined && key !== undefined && rest.length === 0) {
        const keys = byModule.get(module) ?? settingFieldsOf(module);
        byModule.set(module, keys);
        field = keys.get(key);
      }
      if (field === undefined) {
        fail(
          element,
          name,
          "settings_key_unresolved",
          `gen cannot read the setting key \`${host.text(element)}\` of ${name}: it names no setting field of this member's settings classes`,
          `pick keys as \`${local || "Settings"}.<module>.<name>\` in an array literal, each declared by this member's \`<module>.settings.ts\``,
        );
        return undefined;
      }
      fields.push(field);
    }
    return fields;
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
    // `Settings.pick([Settings.orders.customersMayCancel])`: the picked keys' own fields (stackra-209).
    if (info.settingsPick === true) {
      const fields = pickedSettings(node, name);
      return fields === undefined ? undefined : { ...head, fields, relations: [] };
    }
    const heritage = heritageOf(node);

    if (info.base !== undefined && !info.base.own && info.kind === "config") {
      const { fields, relations } = fieldsOf(name, configChain(info.chain), node);
      return {
        ...head,
        base: { kind: "package", name: info.base.name, from: info.base.from },
        fields,
        relations,
      };
    }
    const baseNode = info.chain[1];
    // `class CreateOrderForm extends RequestedLine`, a consumed shape: its fields are in its `schema` (STA-1363).
    if (
      info.base !== undefined &&
      !info.base.own &&
      baseNode !== undefined &&
      kindInfo(baseNode)?.remote === true
    )
      return {
        ...head,
        base: { kind: "remote", name: info.base.name, from: info.base.from },
        ...fieldsOf(name, [node]),
      };
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
      const argument = heritage?.call?.arguments?.[0];
      const symbol = argument === undefined ? undefined : host.symbolAt(argument);
      // `PickType(CreateOrderInput, ["lines"])` of a consumed shape derives from its `schema` (STA-1363).
      if (source?.remote === true && argument !== undefined && symbol !== undefined) {
        const ref = refOf(argument, symbol);
        return {
          ...head,
          base: {
            kind: "remote",
            name: ref.name,
            from: ref.from,
            derive: { helper: info.derive.helper, keys: info.derive.keys },
          },
          ...fieldsOf(name, [node]),
        };
      }
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
        // A symbol-keyed member (`[OptionalProps]`) has the checker's internal `__@<name>@<id>` name: no column.
        if (
          !isStackra(host.fileName(declaration)) ||
          propertyName.startsWith("~") ||
          propertyName.startsWith("__@")
        )
          continue;
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
    } else if (kind === "driver" || kind === "model_addition" || heritage.method === "place")
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

  /** The partner of the nearest base in `chain` whose own heritage names one (a driver's `Driver(Port)` base). */
  const inheritedPartner = (chain: readonly TsNode[]): DeclaredClass["partner"] => {
    for (const base of chain) {
      const baseHeritage = heritageOf(base);
      const partner =
        baseHeritage === undefined ? undefined : partnerOf(base, "driver", baseHeritage);
      if (partner !== undefined) return partner;
    }
    return undefined;
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
    // Every other kind typed against its same-stem subject (ADR 0305 rules 5 and 6, STA-1306).
    const suffix = STEM_PARTNERED[kind];
    if (suffix !== undefined && partner.name !== name.slice(0, -suffix.length))
      fail(
        at,
        name,
        "partner_mismatch",
        `${name} is typed against ${partner.name}, not its same-stem subject ${name.slice(0, -suffix.length) || "(none)"}`,
        `name it ${partner.name}${suffix}, or type it against the class its stem names`,
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
    // An abstract class is a kind base (`DomainEvent extends Event` in @stackra/events), never built or emitted.
    const isAbstract = has(node, "AbstractKeyword");
    // Below the container a driver extends its port and is built by hand, never by the container (STA-1365 item 4).
    const portDriver =
      info.kind === "port" &&
      path.endsWith(".driver.ts") &&
      BELOW_CONTAINER_PACKAGES.has(packageOf(path) ?? "");
    if (info.kind === "event" && !isAbstract)
      fail(
        node.name ?? node,
        name,
        "event_base_abstract",
        "`Event` is the abstract base of the four event kinds",
        "extend DomainEvent, IntegrationEvent, WebhookEvent or AnalyticsEvent",
      );
    // Kind base names are reserved: a model named `Policy` would shadow the base (ADR 0305 rule 4, STA-1306).
    if (info.kind === "model" && KIND_BASES[name] !== undefined)
      fail(
        node.name ?? node,
        name,
        "kind_base_name_reserved",
        `the model ${name} takes the name of the ${name} kind base`,
        `rename the model (\`${name}Record\`, or the domain word it stands for); kind base names are reserved`,
      );
    const heritage = heritageOf(node) as Heritage;
    const direct = info.chain.length === 1;
    const optionsArgument =
      !direct ||
      heritage.call === undefined ||
      heritage.method === "with" ||
      heritage.method === "of"
        ? undefined
        : info.kind === "driver" || info.kind === "model_addition" || heritage.method === "place"
          ? heritage.call.arguments?.[1]
          : heritage.call.arguments?.[0];
    const options = optionsOf(optionsArgument);
    // A driver over the package's own base (`class EpsonReceiptPrinterDriver extends NetworkReceiptPrinterDriver`) takes
    // its port from the nearest base whose heritage names one, so it stays a candidate in the manifest.
    const partner =
      partnerOf(node, info.kind, heritage) ??
      (info.kind === "driver" ? inheritedPartner(info.chain.slice(1)) : undefined);
    checkPartner(node, info.kind, partner, options);

    const members = node.members ?? [];
    // The container calls the nearest constructor the chain declares: the class's own, else its base's (STA-1365 item 5).
    const constructor =
      isAbstract || portDriver
        ? undefined
        : info.chain
            .map((link) =>
              (link.members ?? []).find((member) => host.kind(member) === "Constructor"),
            )
            .find((found) => found !== undefined);
    // A package base's tokens are named by that package's own `#…` paths: the member imports them from its entries.
    const owner = constructor === undefined ? "" : host.fileName(constructor);
    const lift = (ref: ClassRef): ClassRef =>
      isOwn(owner) ? ref : { ...ref, from: publicSpecifier(packageOf(owner) ?? "", ref.from) };
    const deps = (constructor?.parameters ?? [])
      .map((parameter) => tokenOf(parameter, name))
      .filter((token): token is TokenRef => token !== undefined)
      .map((token) => ({
        ...token,
        class: lift(token.class),
        ...(token.of !== undefined ? { of: lift(token.of) } : {}),
      }));

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
      ...(isAbstract ? { abstract: true as const } : {}),
    };
  };

  // The classes the `base-matches-suffix` lint lets sit in a kind file without a kind base, so gen does too (STA-1365).
  const lintExempt = (statement: TsNode, file: string): boolean => {
    const heritage = heritageOf(statement);
    const base =
      heritage === undefined ? undefined : host.text(heritage.target).split(/[.(<\s]/)[0];
    // A class of the same kind (`extends Error`): the lint reads the base's name, never its import.
    if (file.endsWith(".error.ts") && base?.endsWith("Error") === true) return true;
    if (heritage === undefined && TESTING_HARNESS.test(file)) return true;
    return BASE_LINT_DISABLED.test(host.leading(statement).trimEnd().split("\n").at(-1) ?? "");
  };

  const classNodes = (file: TsNode): TsNode[] =>
    (file.statements ?? []).filter(
      (statement) => host.kind(statement) === "ClassDeclaration" && statement.name !== undefined,
    );

  // Shell slots and fills (ADR 0438): `export const X = defineSlot<P>({...})` / `fillSlot(Slot, Component, {...})`
  // with the callee imported from @stackra/panel.
  const panelCalls = (file: TsNode, callee: string): { declaration: TsNode; call: TsNode }[] => {
    const found: { declaration: TsNode; call: TsNode }[] = [];
    if (importsOf(file.fileName ?? "").get(callee) !== "@stackra/panel") return found;
    for (const statement of file.statements ?? []) {
      if (host.kind(statement) !== "VariableStatement" || !has(statement, "ExportKeyword"))
        continue;
      for (const declaration of statement.declarationList?.declarations ?? []) {
        const call = declaration.initializer;
        if (
          call !== undefined &&
          declaration.name !== undefined &&
          host.kind(call) === "CallExpression" &&
          call.expression !== undefined &&
          host.text(call.expression) === callee
        )
          found.push({ declaration, call });
      }
    }
    return found;
  };
  // The props record of the `Slot<P>` typed at `at`: each prop of `P` (`name?` when optional) to its type text.
  const slotPropsOf = (at: TsNode): Record<string, string> => {
    const symbol = host
      .properties(host.typeAt(at))
      .find((property) => host.symbolName(property) === "props");
    if (symbol === undefined) return {};
    const type = host.typeOfSymbol(symbol);
    const defined = (host.unionMembers(type) ?? [type]).filter(
      (member) => !host.typeHas(member, "Undefined"),
    );
    const props = defined.length === 1 && defined[0] !== undefined ? defined[0] : type;
    const out: Record<string, string> = {};
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    for (const property of [...host.properties(props)].sort((left, right) =>
      host.symbolName(left) < host.symbolName(right) ? -1 : 1,
    ))
      out[`${host.symbolName(property)}${host.symbolHas(property, "Optional") ? "?" : ""}`] =
        host.typeText(host.typeOfSymbol(property));
    return out;
  };
  const notConstant = (node: TsNode, subject: string, call: string): void =>
    fail(
      node,
      subject,
      "slot_options_not_constant",
      `gen cannot read the ${call} options of ${subject} without running it`,
      call === "defineSlot"
        ? 'write `export const X = defineSlot<Props>({ key: "area.slot_name", surface: "console" })` with literal values'
        : 'write `export const X = fillSlot(ImportedSlot, Component, { surface: "console" })` with a literal surface',
    );

  return {
    sources,
    errors,
    clientImports: () => {
      const found = new Map<string, string>();
      const own = all
        .map((file) => file.fileName ?? "")
        .filter(isOwn)
        // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
        .sort();
      for (const path of own)
        for (const from of importsOf(path).values())
          if (
            from.startsWith(CLIENTS_SPECIFIER) &&
            !found.has(from.slice(CLIENTS_SPECIFIER.length))
          )
            found.set(from.slice(CLIENTS_SPECIFIER.length), rel(path));
      return (
        [...found]
          // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
          .sort(([left], [right]) => (left < right ? -1 : 1))
          .map(([service, file]) => ({ service, file }))
      );
    },
    classes: (file) =>
      classNodes(file)
        .map(readClass)
        .filter((found): found is DeclaredClass => found !== undefined),
    shapes: (file) =>
      classNodes(file)
        .map(readShape)
        .filter((found): found is ShapeIR => found !== undefined),
    slots: (file) => {
      const path = file.fileName ?? "";
      const found: SlotIR[] = [];
      for (const { declaration, call } of panelCalls(file, "defineSlot")) {
        const name = nameOf(declaration.name);
        const options = constant(call.arguments?.[0]);
        const key = isPlainObject(options) ? options["key"] : undefined;
        const surface = isPlainObject(options) ? options["surface"] : undefined;
        const cardinality = isPlainObject(options) ? (options["cardinality"] ?? "one") : undefined;
        if (
          typeof key !== "string" ||
          typeof surface !== "string" ||
          typeof cardinality !== "string"
        ) {
          notConstant(declaration, name, "defineSlot");
          continue;
        }
        found.push({
          name,
          file: rel(path),
          importPath: importPathOf(path),
          key,
          surface,
          cardinality,
          props: declaration.name === undefined ? {} : slotPropsOf(declaration.name),
        });
      }
      return found;
    },
    fills: (file) => {
      const path = file.fileName ?? "";
      const found: SlotFillIR[] = [];
      for (const { declaration, call } of panelCalls(file, "fillSlot")) {
        const name = nameOf(declaration.name);
        const slot = call.arguments?.[0];
        const symbol = slot === undefined ? undefined : host.symbolAt(slot);
        const options = constant(call.arguments?.[2]);
        const surface = isPlainObject(options) ? options["surface"] : undefined;
        if (slot === undefined || symbol === undefined || typeof surface !== "string") {
          notConstant(declaration, name, "fillSlot");
          continue;
        }
        const { line, column } = host.position(declaration);
        found.push({
          name,
          file: rel(path),
          line,
          column,
          slot: refOf(slot, symbol),
          surface,
          props: slotPropsOf(slot),
        });
      }
      return found;
    },
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
      const classes: string[] = [];
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
        else if (statement.name !== undefined) {
          record(nameOf(statement.name), false);
          if (kind === "ClassDeclaration" && !lintExempt(statement, rel(path)))
            classes.push(nameOf(statement.name));
        }
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
        ...(classes.length > 0 ? { classes } : {}),
      };
    },
  };
}
