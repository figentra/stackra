/**
 * Stackra file contract:
 * Purpose: `classComponentsPlugin`, the class-component compiler as a Babel plugin: every top-level
 *          `class X extends Component<P>` whose `Component` is imported from `#stackra/ui` becomes a plain function
 *          component. A field becomes `useState` (lazy unless its initializer is a literal), a field holding a `use*`
 *          call becomes a read-only hook result, a method or getter a hoisted function, `mount()` and `unmount()` one
 *          `useEffect(..., [])` through `useEffectEvent`, `render()` the function's tail, `this.props` the `props`
 *          parameter, and `this.x = v` / `this.x++` / `this.x += v` the setter (the updater form when it reads the
 *          field). The React hooks it uses are imported from `react`.
 * Boundary: a syntax transform only; it never type-checks. Every created node takes the `loc` of the member it came
 *           from, so source maps, stacks and lint findings point at the class line. Unsupported forms (a constructor,
 *           a static or `#private` member, mutating state in place, a nested state write, a bare `this`, a missing
 *           `render`) fail with a Babel code frame on the offending node. A file without the import is untouched.
 * Runtime: node
 * Governing contract: ADR 0305 (rules 37 to 41: class components, the mapping, the compiler is a gen work item); the
 *                     STA-402 class-components spike (the plugin and its eight checks).
 */
import type { NodePath, PluginObject, types as BabelTypes, Visitor } from "@babel/core";

import { COMPONENT_MODULE } from "#node/constants/component-module.constant";

/** The `@babel/types` namespace a plugin receives. */
type Types = typeof BabelTypes;

/** What a class member compiles to. */
type MemberKind = "state" | "hook" | "method" | "getter" | "render" | "mount" | "unmount";

/** One class member and the bindings it compiles to. */
interface Member {
  readonly kind: MemberKind;
  readonly name: string;
  readonly binding: string;
  readonly setter?: string;
  written: boolean;
  readonly path: NodePath<BabelTypes.ClassProperty> | NodePath<BabelTypes.ClassMethod>;
}

/** The state of the `this` rewrite inside one member. */
interface ThisState {
  readonly t: Types;
  readonly members: Map<string, Member>;
  readonly propsName: string;
  readonly program: NodePath<BabelTypes.Program>;
  /** Inside the right side of a state write: reads of that field become the updater's parameter. */
  readonly updater: { readonly field: string; readonly param: string; isUsed: boolean } | undefined;
}

/** A React hook call: `use` alone or followed by a capital or digit. */
const HOOK_NAME = /^use($|[A-Z0-9])/;

/** The lifecycle methods React calls. */
const LIFECYCLE = new Set(["mount", "unmount"]);

/** Methods that mutate an array or a collection in place. */
const MUTATORS = new Set([
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
  "fill",
  "copyWithin",
  "set",
  "add",
  "delete",
  "clear",
]);

/** Gives `node` the source location of `from`, so the source map points at the class member. */
function at<N extends BabelTypes.Node>(node: N, from: BabelTypes.Node): N {
  return Object.assign(node, { loc: from.loc, start: from.start, end: from.end });
}

/** Whether `path` is assigned, updated or deleted. */
function isWriteTarget(path: NodePath): boolean {
  const parent = path.parentPath;
  if (parent === null) return false;
  return (
    (parent.isAssignmentExpression() && parent.node.left === path.node) ||
    parent.isUpdateExpression() ||
    parent.isUnaryExpression({ operator: "delete" })
  );
}

/** Whether an initializer is cheap enough to pass to `useState` directly instead of a lazy initializer. */
function isCheap(t: Types, node: BabelTypes.Expression): boolean {
  return (
    (t.isLiteral(node) && !(t.isTemplateLiteral(node) && node.expressions.length > 0)) ||
    t.isIdentifier(node, { name: "undefined" }) ||
    (t.isUnaryExpression(node, { operator: "-" }) && t.isNumericLiteral(node.argument))
  );
}

/** Every identifier the class body binds or references, so a generated binding never shadows one. */
function collectNames(cls: NodePath<BabelTypes.ClassDeclaration>): Set<string> {
  const names = new Set<string>();
  cls.get("body").traverse({
    Identifier(path) {
      if (path.isReferenced() || path.isBindingIdentifier()) names.add(path.node.name);
    },
  });
  return names;
}

/** The local name of `Component` imported from `#stackra/ui`, and how to remove that import. */
function findBaseImport(
  program: NodePath<BabelTypes.Program>,
): { readonly local: string; remove(): void } | undefined {
  for (const statement of program.get("body")) {
    if (!statement.isImportDeclaration() || statement.node.source.value !== COMPONENT_MODULE)
      continue;
    for (const specifier of statement.get("specifiers")) {
      if (!specifier.isImportSpecifier()) continue;
      const imported = specifier.node.imported;
      const name = imported.type === "Identifier" ? imported.name : imported.value;
      if (name !== "Component") continue;
      return {
        local: specifier.node.local.name,
        remove() {
          specifier.remove();
          if (statement.node.specifiers.length === 0) statement.remove();
        },
      };
    }
  }
  return undefined;
}

/** Rewrites one `this.member` access. */
function rewriteThis(path: NodePath<BabelTypes.ThisExpression>, state: ThisState): void {
  const { t, members } = state;
  const access = path.parentPath;
  if (
    !access.isMemberExpression() ||
    access.node.object !== path.node ||
    access.node.computed ||
    !t.isIdentifier(access.node.property)
  )
    throw path.buildCodeFrameError(
      "Use `this` only as `this.member` in a component class (it has no instance).",
    );
  const key = access.node.property.name;
  if (key === "props") {
    access.replaceWith(t.identifier(state.propsName));
    return;
  }
  const member = members.get(key);
  if (member === undefined)
    throw access.buildCodeFrameError(`The component has no member "${key}".`);
  switch (member.kind) {
    case "render":
    case "mount":
    case "unmount":
      throw access.buildCodeFrameError(`${key}() is called by React; it cannot be referenced.`);
    case "method":
      access.replaceWith(t.identifier(member.binding));
      return;
    case "getter":
    case "hook":
      if (isWriteTarget(access))
        throw access.buildCodeFrameError(
          `"${key}" is read-only (${member.kind === "getter" ? "a getter" : "a hook result"}).`,
        );
      access.replaceWith(
        member.kind === "getter"
          ? t.callExpression(t.identifier(member.binding), [])
          : t.identifier(member.binding),
      );
      return;
    case "state":
      rewriteState(state, access, member);
  }
}

/** The visitor that rewrites `this` inside one member; functions and classes with their own `this` are skipped. */
const thisVisitor: Visitor<ThisState> = {
  "FunctionDeclaration|FunctionExpression|ObjectMethod|Class"(path: NodePath) {
    path.skip();
  },
  ThisExpression(path, state) {
    rewriteThis(path, state);
  },
};

/** Rewrites a read or a write of a state field. */
function rewriteState(
  state: ThisState,
  access: NodePath<BabelTypes.MemberExpression>,
  member: Member,
): void {
  const { t } = state;
  const parent = access.parentPath;
  if (parent.isMemberExpression() && parent.node.object === access.node) {
    const property = parent.node.property;
    const name = !parent.node.computed && t.isIdentifier(property) ? property.name : undefined;
    const isCall =
      parent.parentPath.isCallExpression() && parent.parentPath.node.callee === parent.node;
    if (isWriteTarget(parent) || (isCall && name !== undefined && MUTATORS.has(name)))
      throw parent.buildCodeFrameError(
        `State field "${member.name}" is immutable: assign a new value (this.${member.name} = ...) instead of mutating it.`,
      );
  }
  const write =
    parent.isAssignmentExpression() && parent.node.left === access.node
      ? parent
      : parent.isUpdateExpression()
        ? parent
        : undefined;
  if (write === undefined) {
    if (state.updater?.field === member.name) {
      state.updater.isUsed = true;
      access.replaceWith(t.identifier(state.updater.param));
    } else access.replaceWith(t.identifier(member.binding));
    return;
  }
  if (state.updater !== undefined)
    throw write.buildCodeFrameError("A state write cannot sit inside another state write.");
  const holder = write.parentPath;
  const isStatement =
    holder.isExpressionStatement() ||
    (holder.isArrowFunctionExpression() && holder.node.body === write.node);
  if (!isStatement)
    throw write.buildCodeFrameError(
      `Write "${member.name}" as its own statement: a state write has no value.`,
    );

  member.written = true;
  const param = state.program.scope.generateUid(member.name);
  let next: BabelTypes.Expression;
  let usesPrevious = true;
  if (write.isUpdateExpression()) {
    next = t.binaryExpression(
      write.node.operator === "++" ? "+" : "-",
      t.identifier(param),
      t.numericLiteral(1),
    );
  } else {
    const assignment = write as NodePath<BabelTypes.AssignmentExpression>;
    const right = assignment.get("right");
    const inner: ThisState = { ...state, updater: { field: member.name, param, isUsed: false } };
    if (right.isThisExpression())
      throw right.buildCodeFrameError("Use `this` only as `this.member`.");
    // traverse() does not visit its root, so `this.a = this.b` is handled directly.
    if (right.isMemberExpression() && t.isThisExpression(right.node.object)) {
      const object = right.get("object");
      if (!Array.isArray(object) && object.isThisExpression()) rewriteThis(object, inner);
    } else right.traverse(thisVisitor, inner);
    const operator = assignment.node.operator;
    const value = assignment.node.right;
    if (operator === "=") {
      next = value;
      usesPrevious = inner.updater?.isUsed === true;
    } else {
      const op = operator.slice(0, -1);
      next =
        op === "||" || op === "&&" || op === "??"
          ? t.logicalExpression(op, t.identifier(param), value)
          : t.binaryExpression(
              op as BabelTypes.BinaryExpression["operator"],
              t.identifier(param),
              value,
            );
    }
  }
  const setter = member.setter ?? `set${member.name}`;
  const call = t.callExpression(t.identifier(setter), [
    usesPrevious ? t.arrowFunctionExpression([t.identifier(param)], next) : next,
  ]);
  write.replaceWith(at(call, write.node));
}

/** Compiles one component class in place. */
function compileClass(
  t: Types,
  program: NodePath<BabelTypes.Program>,
  cls: NodePath<BabelTypes.ClassDeclaration>,
  hooks: Set<string>,
): void {
  const node = cls.node;
  if (node.id === null || node.id === undefined)
    throw cls.buildCodeFrameError(
      "A component class needs a name (it becomes the component name).",
    );
  const id = node.id;
  if (node.abstract === true)
    throw cls.buildCodeFrameError("A component class cannot be abstract.");
  if ((node.decorators?.length ?? 0) > 0)
    throw cls.buildCodeFrameError("A component class takes no decorators.");

  const used = collectNames(cls);
  const unique = (name: string): string =>
    used.has(name) ? program.scope.generateUid(name) : name;
  const propsName = unique("props");
  const members = new Map<string, Member>();
  for (const path of cls.get("body").get("body")) {
    if (path.isClassProperty()) {
      const { key, computed, value } = path.node;
      if (path.node.static)
        throw path.buildCodeFrameError("Static members are not supported on a component class.");
      if (path.node.declare === true)
        throw path.buildCodeFrameError(
          "`declare` fields are not supported: give the field an initializer.",
        );
      if (computed || !t.isIdentifier(key))
        throw path.buildCodeFrameError("A component field needs a plain name.");
      if (key.name === "props")
        throw path.buildCodeFrameError("`props` is reserved: props come from Component<Props>.");
      if ((value === null || value === undefined) && path.node.optional !== true)
        throw path.buildCodeFrameError(
          `Field "${key.name}" needs an initializer (or mark it optional: ${key.name}?: T).`,
        );
      const isHook =
        t.isCallExpression(value) &&
        t.isIdentifier(value.callee) &&
        HOOK_NAME.test(value.callee.name);
      const setter = unique(`set${key.name.charAt(0).toUpperCase()}${key.name.slice(1)}`);
      members.set(key.name, {
        kind: isHook ? "hook" : "state",
        name: key.name,
        binding: unique(key.name),
        setter,
        written: false,
        path,
      });
    } else if (path.isClassMethod()) {
      const { key, computed, kind } = path.node;
      if (path.node.static)
        throw path.buildCodeFrameError("Static members are not supported on a component class.");
      if (kind === "constructor")
        throw path.buildCodeFrameError(
          "A component class has no constructor: use field initializers (`count = this.props.start`).",
        );
      if (kind === "set")
        throw path.buildCodeFrameError("Setters are not supported: write a method.");
      if (computed || !t.isIdentifier(key))
        throw path.buildCodeFrameError("A component method needs a plain name.");
      if (path.node.generator)
        throw path.buildCodeFrameError("Generator methods are not supported.");
      const name = key.name;
      let memberKind: MemberKind = kind === "get" ? "getter" : "method";
      if (name === "render" || LIFECYCLE.has(name)) {
        if (kind !== "method") throw path.buildCodeFrameError(`"${name}" must be a plain method.`);
        if (path.node.params.length > 0)
          throw path.buildCodeFrameError(`${name}() takes no parameters.`);
        memberKind = name as MemberKind;
      }
      if (memberKind === "unmount" && path.node.async)
        throw path.buildCodeFrameError(
          "unmount() must be synchronous: React does not await cleanup.",
        );
      if (memberKind === "render" && path.node.async)
        throw path.buildCodeFrameError("render() must be synchronous.");
      members.set(name, { kind: memberKind, name, binding: unique(name), written: false, path });
    } else if (path.isClassPrivateProperty() || path.isClassPrivateMethod()) {
      throw path.buildCodeFrameError(
        "#private members are not supported: every member is already private to the component.",
      );
    } else throw path.buildCodeFrameError("This member is not supported on a component class.");
  }
  const render = members.get("render");
  if (render === undefined)
    throw cls.get("id").buildCodeFrameError(`${id.name} needs a render() method.`);

  for (const member of members.values()) {
    const target = member.path.isClassProperty()
      ? member.path.get("value")
      : member.path.get("body");
    if (Array.isArray(target) || target.node === null || target.node === undefined) continue;
    (target as NodePath).traverse(thisVisitor, {
      t,
      members,
      propsName,
      program,
      updater: undefined,
    });
    // traverse() does not visit its root: a bare `this.x` initializer is rewritten here.
    if (target.isMemberExpression() && t.isThisExpression(target.node.object)) {
      const object = target.get("object");
      if (!Array.isArray(object) && object.isThisExpression())
        rewriteThis(object, { t, members, propsName, program, updater: undefined });
    }
  }

  const body: BabelTypes.Statement[] = [];
  for (const member of members.values()) {
    if (member.kind !== "state" && member.kind !== "hook") continue;
    const property = member.path.node as BabelTypes.ClassProperty;
    const init = property.value ?? undefined;
    if (member.kind === "hook" && init !== undefined) {
      body.push(
        at(
          t.variableDeclaration("const", [
            at(t.variableDeclarator(t.identifier(member.binding), init), property),
          ]),
          property,
        ),
      );
      continue;
    }
    hooks.add("useState");
    const args =
      init === undefined
        ? []
        : [isCheap(t, init) ? init : at(t.arrowFunctionExpression([], init), init)];
    const call = at(t.callExpression(t.identifier("useState"), args), property);
    const annotation = property.typeAnnotation;
    if (annotation !== null && annotation !== undefined && t.isTSTypeAnnotation(annotation)) {
      const type =
        property.optional === true
          ? t.tsUnionType([annotation.typeAnnotation, t.tsUndefinedKeyword()])
          : annotation.typeAnnotation;
      call.typeArguments = t.tsTypeParameterInstantiation([type]);
    }
    const pattern = t.arrayPattern([
      t.identifier(member.binding),
      ...(member.written && member.setter !== undefined ? [t.identifier(member.setter)] : []),
    ]);
    body.push(
      at(
        t.variableDeclaration("const", [at(t.variableDeclarator(pattern, call), property)]),
        property,
      ),
    );
  }
  for (const member of members.values()) {
    if (member.kind !== "method" && member.kind !== "getter") continue;
    const method = member.path.node as BabelTypes.ClassMethod;
    const fn = at(
      t.functionDeclaration(
        t.identifier(member.binding),
        method.params as BabelTypes.FunctionDeclaration["params"],
        method.body,
        false,
        method.async,
      ),
      method,
    );
    if (fn.id !== null && fn.id !== undefined) fn.id.loc = method.key.loc ?? null;
    if (method.returnType !== null && method.returnType !== undefined)
      fn.returnType = method.returnType;
    if (method.typeParameters !== null && method.typeParameters !== undefined)
      fn.typeParameters = method.typeParameters as BabelTypes.TSTypeParameterDeclaration;
    body.push(fn);
  }
  const mount = members.get("mount");
  const unmount = members.get("unmount");
  for (const member of [mount, unmount]) {
    if (member === undefined) continue;
    hooks.add("useEffectEvent");
    const method = member.path.node as BabelTypes.ClassMethod;
    const handler = at(t.arrowFunctionExpression([], method.body, method.async), method);
    body.push(
      at(
        t.variableDeclaration("const", [
          at(
            t.variableDeclarator(
              t.identifier(member.binding),
              at(t.callExpression(t.identifier("useEffectEvent"), [handler]), method),
            ),
            method,
          ),
        ]),
        method,
      ),
    );
  }
  const anchor = (mount ?? unmount)?.path.node;
  if (anchor !== undefined) {
    hooks.add("useEffect");
    const effect: BabelTypes.Statement[] = [];
    if (mount !== undefined)
      effect.push(t.expressionStatement(t.callExpression(t.identifier(mount.binding), [])));
    if (unmount !== undefined)
      effect.push(
        t.returnStatement(
          t.arrowFunctionExpression(
            [],
            t.blockStatement([
              t.expressionStatement(t.callExpression(t.identifier(unmount.binding), [])),
            ]),
          ),
        ),
      );
    body.push(
      at(
        t.expressionStatement(
          t.callExpression(t.identifier("useEffect"), [
            t.arrowFunctionExpression([], t.blockStatement(effect)),
            t.arrayExpression([]),
          ]),
        ),
        anchor,
      ),
    );
  }
  body.push(...(render.path.node as BabelTypes.ClassMethod).body.body);

  const props = t.identifier(propsName);
  const typeArguments = node.superTypeArguments;
  const propsType =
    typeArguments?.type === "TSTypeParameterInstantiation" ? typeArguments.params[0] : undefined;
  props.typeAnnotation = t.tsTypeAnnotation(propsType ?? t.tsTypeLiteral([]));
  const fn = at(
    t.functionDeclaration(t.identifier(id.name), [props], t.blockStatement(body)),
    node,
  );
  if (fn.id !== null && fn.id !== undefined) fn.id.loc = id.loc ?? null;
  if (node.typeParameters?.type === "TSTypeParameterDeclaration")
    fn.typeParameters = node.typeParameters;
  if (node.leadingComments !== null && node.leadingComments !== undefined)
    fn.leadingComments = node.leadingComments;
  program.scope.removeOwnBinding(id.name);
  cls.replaceWith(fn);
}

/** Adds the React hooks the compiled components use to the file's `react` import. */
function addReactImports(
  t: Types,
  program: NodePath<BabelTypes.Program>,
  hooks: ReadonlySet<string>,
): void {
  if (hooks.size === 0) return;
  let target: NodePath<BabelTypes.ImportDeclaration> | undefined;
  for (const statement of program.get("body"))
    if (
      statement.isImportDeclaration() &&
      statement.node.source.value === "react" &&
      statement.node.importKind !== "type" &&
      !statement.node.specifiers.some((specifier) => t.isImportNamespaceSpecifier(specifier))
    )
      target = statement;
  const missing = [...hooks].filter((hook) => {
    const binding = program.scope.getBinding(hook);
    if (binding === undefined) return true;
    const fromReact =
      binding.path.isImportSpecifier() &&
      (binding.path.parentPath?.node as BabelTypes.ImportDeclaration | undefined)?.source.value ===
        "react";
    if (!fromReact)
      throw binding.path.buildCodeFrameError(
        `"${hook}" is reserved in a file with a component class (the compiled output imports it from react).`,
      );
    return false;
  });
  const specifiers = missing
    .sort()
    .map((hook) => t.importSpecifier(t.identifier(hook), t.identifier(hook)));
  if (target !== undefined) target.node.specifiers.push(...specifiers);
  else if (specifiers.length > 0)
    program.unshiftContainer("body", t.importDeclaration(specifiers, t.stringLiteral("react")));
}

/**
 * The class-component Babel plugin.
 *
 * @param api - the Babel plugin API; only `types` is read.
 * @example
 * await transformAsync(source, { filename: "counter.tsx", plugins: [classComponentsPlugin] });
 */
export function classComponentsPlugin(api: { readonly types: Types }): PluginObject {
  const t = api.types;
  return {
    name: "stackra-class-components",
    visitor: {
      Program(program) {
        const base = findBaseImport(program);
        if (base === undefined) return;
        const classes: NodePath<BabelTypes.ClassDeclaration>[] = [];
        program.traverse({
          Class(path) {
            if (!t.isIdentifier(path.node.superClass, { name: base.local })) return;
            if (path.scope.getBinding(base.local)?.kind !== "module") return;
            if (
              !path.isClassDeclaration() ||
              !(path.parentPath.isProgram() || path.parentPath.isExportDeclaration())
            )
              throw path.buildCodeFrameError(
                "A component class must be a top-level class declaration.",
              );
            classes.push(path);
          },
        });
        if (classes.length === 0) return;
        const hooks = new Set<string>();
        for (const cls of classes) compileClass(t, program, cls, hooks);
        addReactImports(t, program, hooks);
        base.remove();
        program.scope.crawl();
      },
    },
  };
}
