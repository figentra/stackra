/**
 * Stackra file contract:
 * Purpose: `clientToolsOf`, the client tools of an app derived from what it declares: `navigate.<route>` per route, the
 *          list, filter, sort, select, view and record tools of each panel resource of its dependency manifests'
 *          `ui.resources` trees, `<resource>.<action>.prefill` per placed action that is a tool, the theming previews,
 *          the tour tools (once the app declares a tour), and `ui.point` at the declared anchors; and the refusals `client_tool_collision`,
 *          `prefill_tool_off`, `anchor_undeclared` and `context_record_not_public_id`.
 * Boundary: pure over the IR; never reads the source. Every tool changes only the viewer's screen (L0), so none carries
 *           an approval; `ai: false` on a route, a resource tree, a placement or `defineApp` opts out. Rows come back
 *           sorted by module then key, so the table is stable. A client tool is never hand-written (ADR 0490 decision
 *           1) and belongs to the module that declares it (decision 16): a route's, a resource's by its key's module,
 *           and the app's own for theming, tours and anchors.
 *           shortcut: `navigate.<route>` takes the route's `:param` segments only; search params are not typed, add
 *           them when a route declares a `search` shape the tool can name. A prefill's input is the action's top-level
 *           fields that hold no `$ref` (all optional, since it is a draft the human completes); nested shapes are left
 *           out until the manifest's schemas are inlined.
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decisions 1, 2, 5, 9, 10 and 16); ADR 0360 (decision 4: `tool: false`); STA-1631.
 */
import type { Json, StackraManifest } from "@stackra/contracts";

import { routeKey } from "#core/functions/route-key.function";
import { toolName } from "#core/functions/tool-name.function";
import type { ClientToolIR } from "#core/types/client-tool-ir.type";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A JSON Schema under construction. */
type JsonSchema = { [key: string]: Json };

/** A tool with the file a refusal about it points at. */
type Candidate = ClientToolIR & { readonly file: string };

/** One panel resource of a dependency manifest. */
interface RecordedResource {
  readonly key: string;
  readonly tree: Readonly<Record<string, unknown>>;
  readonly manifest: StackraManifest;
}

/** A plain object, or none. */
const objectOf = (value: unknown): Readonly<Record<string, unknown>> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

/** A string, or none. */
const textOf = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

/** The objects of an array, or none. */
const listOf = (value: unknown): readonly Readonly<Record<string, unknown>>[] =>
  Array.isArray(value)
    ? value.flatMap((item: unknown) => {
        const object = objectOf(item);
        return object === undefined ? [] : [object];
      })
    : [];

/** The first of `fields` each object of `value` carries as text. */
const keysOf = (value: unknown, ...fields: string[]): string[] =>
  listOf(value).flatMap((item) => fields.map((field) => textOf(item[field])).find(Boolean) ?? []);

/** An object JSON Schema over `properties`. */
const objectSchema = (properties: JsonSchema, required: readonly string[] = []): JsonSchema => ({
  type: "object",
  properties,
  ...(required.length > 0 ? { required: [...required] } : {}),
  additionalProperties: false,
});

/** A string JSON Schema, an enum of `values` when given. */
const stringSchema = (values?: readonly string[]): JsonSchema => ({
  type: "string",
  ...(values === undefined || values.length === 0 ? {} : { enum: [...values] }),
});

/** Whether the member declares `name` itself or through a dependency manifest. */
const declares = (ir: MemberIR, name: string): boolean =>
  (ir.packages ?? []).includes(name) || ir.dependencies.some((item) => item.package === name);

/** The panel resources of the dependency manifests, first manifest per key winning, sorted by key. */
function resourcesOf(ir: MemberIR): RecordedResource[] {
  const found = new Map<string, RecordedResource>();
  for (const { manifest } of ir.dependencies) {
    const resources = objectOf(objectOf(manifest["ui"])?.["resources"]);
    for (const [key, tree] of Object.entries(resources ?? {})) {
      const node = objectOf(tree);
      if (node !== undefined && !found.has(key)) found.set(key, { key, tree: node, manifest });
    }
  }
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return [...found.values()].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

/** The action of `manifest` a placement names, by class name or key. */
function actionOf(
  manifest: StackraManifest,
  reference: unknown,
): Readonly<Record<string, unknown>> | undefined {
  const name = textOf(reference) ?? textOf(objectOf(reference)?.["$class"]);
  return (manifest.actions ?? []).find((entry) => entry["class"] === name || entry["key"] === name);
}

/** The draft input of an action: its top-level fields without a `$ref`, none required. */
function draftOf(manifest: StackraManifest, entry: Readonly<Record<string, unknown>>): JsonSchema {
  const ref = textOf(objectOf(entry["input"])?.["$ref"])?.replace("#/schemas/", "");
  const schema = ref === undefined ? undefined : objectOf(objectOf(manifest.schemas)?.[ref]);
  const properties = objectOf(schema?.["properties"]) ?? {};
  return objectSchema(
    Object.fromEntries(
      Object.entries(properties).filter(([, value]) => !JSON.stringify(value).includes("$ref")),
    ) as JsonSchema,
  );
}

/** The path parameters of a route path. */
const paramsOf = (path: string): string[] =>
  [...path.matchAll(/:([A-Za-z_]\w*)/g)].map((match) => match[1] ?? "");

/** The anchors the member declares and its dependency manifests list (`ui.anchors`), sorted and unique. */
function declaredAnchors(ir: MemberIR): string[] {
  const keys = new Set([
    ...(ir.anchors ?? []).map((anchor) => anchor.key),
    ...ir.dependencies.flatMap(({ manifest }) => {
      const listed = objectOf(manifest["ui"])?.["anchors"];
      return Array.isArray(listed)
        ? listed.filter((item): item is string => typeof item === "string")
        : [];
    }),
  ]);
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return [...keys].sort();
}

/**
 * The client tools of the app `ir`, and what refuses them.
 *
 * @param ir - the member read by discovery; a member that is not an app has none.
 * @example
 * clientToolsOf(appIr).tools.map((tool) => tool.key); // ["navigate.order_detail", "orders.order.list.filter"]
 */
export function clientToolsOf(ir: MemberIR): {
  readonly tools: readonly ClientToolIR[];
  readonly errors: readonly GenError[];
} {
  if (ir.layout !== "app" || ir.app?.definition["ai"] === false) return { tools: [], errors: [] };
  const errors: GenError[] = [];
  const fail = (
    code: string,
    file: string,
    subject: string,
    message: string,
    fix: string,
  ): void => {
    errors.push({ code, file, line: 0, column: 0, subject, message, fix });
  };
  const candidates: Candidate[] = [];
  const add = (
    file: string,
    kind: string,
    key: string,
    target: string,
    module: string,
    inputSchema: JsonSchema,
    permission?: string,
  ): void => {
    candidates.push({
      key,
      kind,
      target,
      module,
      inputSchema,
      file,
      ...(permission === undefined ? {} : { permission }),
    });
  };

  // A route: `navigate.<route>`, its path parameters as the input (ADR 0490 decision 1).
  for (const route of ir.classes.filter((declared) => declared.kind === "route")) {
    if (route.options["ai"] === false) continue;
    const path = textOf(route.options["path"]);
    if (path === undefined || path === "*") continue;
    const key = routeKey(route.file);
    const params = paramsOf(path);
    add(
      route.file,
      "navigate",
      `navigate.${key}`,
      key,
      route.module,
      objectSchema(Object.fromEntries(params.map((param) => [param, stringSchema()])), params),
      textOf(route.options["permission"]),
    );
    // The record a route publishes is named by one of its path parameters, which must hold a public id (decision 5).
    const record = objectOf(objectOf(route.options["context"])?.["record"]);
    const param = textOf(record?.["param"]);
    if (record !== undefined) {
      const shapeName = textOf(objectOf(route.options["params"])?.["$class"]);
      const field = ir.shapes
        .find((shape) => shape.name === shapeName)
        ?.fields.find((candidate) => candidate.name === param);
      if (param === undefined || !params.includes(param) || field?.type.kind !== "public_id")
        fail(
          "context_record_not_public_id",
          route.file,
          route.name,
          `the page context record \`${param ?? "?"}\` of ${route.name} is not a path parameter typed \`PublicId\``,
          'name a `:param` of the path in `context.record.param` and type it `PublicId<"prefix">` in the route\'s `params` shape',
        );
    }
  }

  // A panel resource and its placed actions (decisions 1 and 2).
  for (const { key, tree, manifest } of resourcesOf(ir)) {
    if (objectOf(tree["options"])?.["ai"] === false) continue;
    const module = key.slice(0, key.indexOf("."));
    const read = `${key}.read`;
    const table = objectOf(tree["table"]);
    const columns = keysOf(table?.["columns"], "key");
    const filters = keysOf(table?.["filters"], "key");
    const views = keysOf(tree["views"], "key", "name");
    const file = "package.json";
    const own = (kind: string, name: string, schema: JsonSchema): void =>
      add(file, kind, `${key}.${name}`, key, module, schema, read);
    own("list_open", "list.open", objectSchema({}));
    own(
      "filter",
      "list.filter",
      objectSchema({
        search: stringSchema(),
        filters: objectSchema(Object.fromEntries(filters.map((filter) => [filter, {}]))),
      }),
    );
    if (columns.length > 0)
      own(
        "sort",
        "list.sort",
        objectSchema({ key: stringSchema(columns), direction: stringSchema(["asc", "desc"]) }, [
          "key",
        ]),
      );
    own(
      "select",
      "list.select",
      objectSchema({ ids: { type: "array", items: stringSchema(), maxItems: 200 } }, ["ids"]),
    );
    own("view_apply", "view.apply", objectSchema({ view: stringSchema(views) }, ["view"]));
    own("record_open", "record.open", objectSchema({ id: stringSchema() }, ["id"]));
    for (const placement of listOf(tree["actions"])) {
      if (placement["kind"] !== "run" || placement["ai"] === false) continue;
      const action = actionOf(manifest, placement["action"]);
      if (action === undefined) continue;
      const actionKey = textOf(action["key"]) ?? "";
      if (action["tool"] === undefined) {
        // `ai: true` on a placement of a `tool: false` action asks for a prefill the agent may not make.
        if (placement["ai"] === true)
          fail(
            "prefill_tool_off",
            file,
            actionKey,
            `the placement of ${actionKey} says \`ai: true\` but the action says \`tool: false\``,
            "drop `ai: true` from the placement, or make the action a tool",
          );
        continue;
      }
      const verb = actionKey.replace(/@\d+$/, "").split(".").pop() ?? "";
      add(
        file,
        "prefill",
        `${key}.${verb}.prefill`,
        actionKey,
        module,
        draftOf(manifest, action),
        textOf(action["permission"]),
      );
    }
  }

  // Theming previews and tours (decisions 9 and 10), and `ui.point` at the declared anchors (decision 1).
  const app = (kind: string, key: string, target: string, schema: JsonSchema): void =>
    add("package.json", kind, key, target, ir.member, schema);
  if (declares(ir, "@stackra/theming"))
    for (const name of ["theme", "mode", "density"])
      app("preview", `ui.${name}.preview`, name, objectSchema({ [name]: stringSchema() }, [name]));
  // A tour is a document kind of `@stackra/experience` (lane 4); the tools exist once the app declares one.
  if (ir.classes.some((declared) => declared.kind === "tour")) {
    app("tour_start", "tour.start", "tour", objectSchema({ tour: stringSchema() }, ["tour"]));
    app("tour_next", "tour.next", "tour", objectSchema({}));
    app("tour_stop", "tour.stop", "tour", objectSchema({}));
  }
  const anchors = declaredAnchors(ir);
  if (anchors.length > 0)
    app("point", "ui.point", "anchor", objectSchema({ anchor: stringSchema(anchors) }, ["anchor"]));
  for (const reference of ir.anchorReferences ?? [])
    if (!anchors.includes(reference.key))
      errors.push({
        code: "anchor_undeclared",
        file: reference.file,
        line: reference.line,
        column: reference.column,
        subject: reference.key,
        message: `the anchor \`${reference.key}\` is referred to but no component declares it`,
        fix: `put \`anchor="${reference.key}"\` on the component, or point at a declared anchor`,
      });

  // Two tools may not share a key or a model-facing name (`orders.order.list.filter` and `orders_order.list.filter`).
  const seen = new Map<string, string>();
  const tools: ClientToolIR[] = [];
  for (const { file, ...tool } of candidates) {
    const name = toolName(tool.key);
    const first = seen.get(name);
    if (first !== undefined) {
      fail(
        "client_tool_collision",
        file,
        tool.key,
        `the client tool \`${tool.key}\` has the same name \`${name}\` as \`${first}\``,
        "rename the route or resource, or opt one out with `ai: false`",
      );
      continue;
    }
    seen.set(name, tool.key);
    tools.push(tool);
  }
  return {
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    tools: tools.sort((a, b) =>
      a.module === b.module
        ? a.key < b.key
          ? -1
          : a.key > b.key
            ? 1
            : 0
        : a.module < b.module
          ? -1
          : 1,
    ),
    errors,
  };
}
