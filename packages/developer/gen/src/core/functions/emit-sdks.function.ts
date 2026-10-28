/**
 * Stackra file contract:
 * Purpose: `emitSdks`, the public SDKs of a member from its manifest (ADR 0039 decision 3, ADR 0217 decision 1): for
 *          every action or query marked `public` with an endpoint, one method in a TypeScript client
 *          (`.stackra/sdks/typescript/index.ts`, with the input and output shapes as types), a Python client
 *          (`.stackra/sdks/python/<member>_client.py`, standard library only) and a PHP client
 *          (`.stackra/sdks/php/<Member>Client.php`, no dependency). Each client takes the base URL, a bearer token and
 *          the pinned dated version (`Stackra-Version`, ADR 0118), sends the input as path, query or JSON body as the
 *          endpoint says, and raises the ADR 0140 refusal envelope as its own error.
 * Boundary: pure and deterministic: methods follow the manifest's order, types are sorted by name. Only `public`
 *           entries are published: an action not marked public is never in an SDK, whatever its area. Which languages
 *           a release ships, and the package names and registries, are the release pipeline's settings, never gen's;
 *           gen writes all three and the pipeline picks. Never from `openapi.json` (ADR 0158).
 * Runtime: isomorphic
 * Governing contract: OS ADR 0039 (decisions 2 and 3); ADR 0217 (decision 1); ADR 0118 (dated versions); ADR 0140 (the
 *                     refusal envelope); ADR 0158 (the manifest is the source); ADR 0294 (decision 10).
 */
import type { Json, StackraManifest } from "@stackra/contracts";
import { camelCase, pascalCase, snakeCase } from "@stackra/support";

import { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";
import { generatedHeader } from "#core/functions/generated-header.function";
import { toolName } from "#core/functions/tool-name.function";
import type { GeneratedFile } from "#core/types/generated-file.type";

/** A JSON object. */
type JsonObject = { readonly [key: string]: Json };

/** Whether a JSON value is an object. */
function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** One published operation, read from a manifest entry. */
interface Operation {
  /** The method name stem, snake_case (`orders_order_cancel`, `orders_order_cancel_v2`). */
  readonly name: string;
  readonly key: string;
  readonly method: string;
  readonly path: string;
  readonly pathParameters: readonly string[];
  readonly input: string | undefined;
  readonly output: string | undefined;
}

/** The schema name a manifest `$ref` points at (`orders.OrderView`). */
function refName(node: unknown): string | undefined {
  const target = isObject(node) ? node["$ref"] : undefined;
  return typeof target === "string" && target.startsWith("#/schemas/")
    ? target.slice("#/schemas/".length)
    : undefined;
}

/**
 * The public operations of `manifest`, in its order.
 *
 * @example
 * publicOperations(manifest).map((operation) => operation.key); // ["orders.order.cancel@1"]
 */
function publicOperations(manifest: StackraManifest): readonly Operation[] {
  const operations: Operation[] = [];
  for (const action of manifest.actions ?? []) {
    const endpoint = action["endpoint"];
    if (
      action["public"] !== true ||
      !isObject(endpoint) ||
      typeof endpoint["method"] !== "string" ||
      typeof endpoint["path"] !== "string"
    )
      continue;
    const version = /@(\d+)$/.exec(action.key)?.[1] ?? "1";
    operations.push({
      name: `${toolName(action.key)}${version === "1" ? "" : `_v${version}`}`,
      key: action.key,
      method: endpoint["method"].toUpperCase(),
      path: endpoint["path"],
      pathParameters: [...endpoint["path"].matchAll(/:(\w+)/g)].map((match) => match[1] ?? ""),
      input: refName(action["input"]),
      output: refName(action["output"]),
    });
  }
  return operations;
}

/** Every schema `roots` reach through `$ref`, sorted. */
function reachable(schemas: JsonObject, roots: readonly (string | undefined)[]): string[] {
  const seen = new Set<string>();
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (!isObject(node)) return;
    const name = refName(node);
    if (name !== undefined && !seen.has(name)) {
      seen.add(name);
      visit(schemas[name]);
    }
    for (const value of Object.values(node)) visit(value);
  };
  for (const root of roots) if (root !== undefined) visit({ $ref: `#/schemas/${root}` });
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return [...seen].sort();
}

/** The class name of a schema name (`orders.OrderView` is `OrderView`). */
function short(name: string): string {
  return name.split(".").pop() ?? name;
}

/** The TypeScript type name of each schema: its class name, with the module prefixed only on a clash. */
function typeNames(names: readonly string[]): Map<string, string> {
  const counts = new Map<string, number>();
  for (const name of names) counts.set(short(name), (counts.get(short(name)) ?? 0) + 1);
  return new Map(
    names.map((name) => [
      name,
      (counts.get(short(name)) ?? 0) > 1
        ? `${pascalCase(name.split(".")[0] ?? "")}${short(name)}`
        : short(name),
    ]),
  );
}

/**
 * The TypeScript type of a JSON schema node.
 *
 * @param named - schema name to TypeScript type name.
 */
function tsType(node: unknown, named: ReadonlyMap<string, string>): string {
  if (!isObject(node)) return "unknown";
  const ref = refName(node);
  if (ref !== undefined) return named.get(ref) ?? "unknown";
  for (const union of ["oneOf", "anyOf"] as const) {
    const members = node[union];
    if (Array.isArray(members)) return members.map((member) => tsType(member, named)).join(" | ");
  }
  if (Array.isArray(node["enum"]))
    return node["enum"].map((value) => JSON.stringify(value)).join(" | ");
  const type = node["type"];
  if (Array.isArray(type))
    return type.map((item) => tsType({ ...node, type: item }, named)).join(" | ");
  switch (type) {
    case "string":
      return "string";
    case "integer":
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    case "array":
      return `Array<${tsType(node["items"], named)}>`;
    case "object": {
      const properties = isObject(node["properties"]) ? node["properties"] : undefined;
      if (properties === undefined)
        return `Record<string, ${node["additionalProperties"] === undefined ? "unknown" : tsType(node["additionalProperties"], named)}>`;
      const required = Array.isArray(node["required"]) ? node["required"].map(String) : [];
      const fields = Object.entries(properties).map(
        ([field, schema]) =>
          `${JSON.stringify(field)}${required.includes(field) ? "" : "?"}: ${tsType(schema, named)}`,
      );
      return `{ ${fields.join("; ")} }`;
    }
    default:
      return "unknown";
  }
}

/** The TypeScript SDK. */
function typescriptSdk(
  manifest: StackraManifest,
  operations: readonly Operation[],
  schemas: JsonObject,
): string {
  const names = reachable(
    schemas,
    operations.flatMap((operation) => [operation.input, operation.output]),
  );
  const named = typeNames(names);
  const client = `${pascalCase(manifest.member)}Client`;
  const types = names.map(
    (name) =>
      `/** \`${name}\` */\nexport type ${named.get(name)} = ${tsType(schemas[name], named)};`,
  );
  const methods = operations.map((operation) => {
    const input = operation.input === undefined ? undefined : named.get(operation.input);
    const output = operation.output === undefined ? "void" : named.get(operation.output);
    return [
      `  /** \`${operation.key}\`: ${operation.method} ${operation.path} */`,
      `  ${camelCase(operation.name)}(${input === undefined ? "" : `input: ${input}, `}options: CallOptions = {}): Promise<${output}> {`,
      `    return this.call(${JSON.stringify(operation.method)}, ${JSON.stringify(operation.path)}, ${JSON.stringify(operation.pathParameters)}, ${input === undefined ? "{}" : "input"}, options) as Promise<${output}>;`,
      "  }",
    ].join("\n");
  });
  const header = generatedHeader({
    from: "stackra.manifest.json (the actions marked public)",
    purpose: `the TypeScript SDK of ${manifest.package}: one method per public action, with its input and output types.`,
    boundary:
      "no dependency: the platform `fetch` (or the one passed in). A refusal throws `ApiError` with the envelope.",
    runtime: "isomorphic",
  });
  return [
    header,
    "",
    ...types,
    "",
    "/** How the client reaches the API. */",
    "export interface ClientOptions {",
    "  /** The region endpoint, such as `https://api.example.com`. */",
    "  readonly baseUrl: string;",
    "  /** The bearer token (an API key or an OAuth access token). */",
    "  readonly token?: string;",
    "  /** The pinned dated API version, sent as `Stackra-Version`. */",
    "  readonly version?: string;",
    "  /** The fetch to use; the platform's by default. */",
    "  readonly fetch?: typeof fetch;",
    "}",
    "",
    "/** Per-call options. */",
    "export interface CallOptions {",
    "  /** Sent as `Idempotency-Key`, so a retried write runs once. */",
    "  readonly idempotencyKey?: string;",
    "}",
    "",
    "/** A refused call: the API's error envelope. */",
    "export class ApiError extends Error {",
    "  readonly status: number;",
    "  readonly code: string;",
    "  readonly category: string;",
    "  readonly body: unknown;",
    "",
    "  constructor(status: number, code: string, category: string, body: unknown) {",
    "    super(`${status} ${code}`);",
    "    this.status = status;",
    "    this.code = code;",
    "    this.category = category;",
    "    this.body = body;",
    "  }",
    "}",
    "",
    `/** The public API of ${manifest.member}. */`,
    `export class ${client} {`,
    "  private readonly options: ClientOptions;",
    "",
    "  constructor(options: ClientOptions) {",
    "    this.options = options;",
    "  }",
    "",
    ...methods.flatMap((method) => [method, ""]),
    "  private async call(",
    "    method: string,",
    "    template: string,",
    "    pathParameters: readonly string[],",
    "    input: object,",
    "    options: CallOptions,",
    "  ): Promise<unknown> {",
    "    const values = input as Record<string, unknown>;",
    "    const path = template.replace(/:(\\w+)/g, (_match, name: string) => encodeURIComponent(String(values[name])));",
    "    const rest = Object.fromEntries(Object.entries(values).filter(([name]) => !pathParameters.includes(name)));",
    "    const url = new URL(path, this.options.baseUrl);",
    '    if (method === "GET")',
    "      for (const [name, value] of Object.entries(rest))",
    '        if (value !== undefined) url.searchParams.set(name, typeof value === "string" ? value : JSON.stringify(value));',
    '    const headers: Record<string, string> = { accept: "application/json" };',
    '    if (this.options.token !== undefined) headers["authorization"] = `Bearer ${this.options.token}`;',
    '    if (this.options.version !== undefined) headers["stackra-version"] = this.options.version;',
    '    if (options.idempotencyKey !== undefined) headers["idempotency-key"] = options.idempotencyKey;',
    '    if (method !== "GET") headers["content-type"] = "application/json";',
    "    const response = await (this.options.fetch ?? fetch)(url, {",
    "      method,",
    "      headers,",
    '      ...(method === "GET" ? {} : { body: JSON.stringify(rest) }),',
    "    });",
    "    const body: unknown = response.status === 204 ? undefined : await response.json();",
    "    if (!response.ok) {",
    "      const envelope = (body ?? {}) as { code?: string; category?: string };",
    '      throw new ApiError(response.status, envelope.code ?? "unknown", envelope.category ?? "unknown", body);',
    "    }",
    "    return body;",
    "  }",
    "}",
    "",
  ].join("\n");
}

/** The Python SDK: standard library only. */
function pythonSdk(manifest: StackraManifest, operations: readonly Operation[]): string {
  const client = `${pascalCase(manifest.member)}Client`;
  const methods = operations.flatMap((operation) => [
    `    def ${operation.name}(self${operation.input === undefined ? "" : ", input: dict"}, idempotency_key: str | None = None):`,
    `        """\`${operation.key}\`: ${operation.method} ${operation.path}"""`,
    `        return self._call(${JSON.stringify(operation.method)}, ${JSON.stringify(operation.path)}, ${JSON.stringify(operation.pathParameters)}, ${operation.input === undefined ? "{}" : "input"}, idempotency_key)`,
    "",
  ]);
  return [
    `# ${GENERATED_NOTICE}; from stackra.manifest.json (the actions marked public)`,
    `# Purpose: the Python SDK of ${manifest.package}: one method per public action.`,
    "# Boundary: standard library only; a refusal raises ApiError with the envelope.",
    "import json",
    "import re",
    "import urllib.error",
    "import urllib.parse",
    "import urllib.request",
    "",
    "",
    "class ApiError(Exception):",
    '    """A refused call: the API\'s error envelope."""',
    "",
    "    def __init__(self, status: int, body):",
    "        self.status = status",
    "        self.body = body",
    '        self.code = (body or {}).get("code", "unknown") if isinstance(body, dict) else "unknown"',
    '        self.category = (body or {}).get("category", "unknown") if isinstance(body, dict) else "unknown"',
    '        super().__init__(f"{status} {self.code}")',
    "",
    "",
    `class ${client}:`,
    `    """The public API of ${manifest.member}."""`,
    "",
    "    def __init__(self, base_url: str, token: str | None = None, version: str | None = None):",
    '        self.base_url = base_url.rstrip("/")',
    "        self.token = token",
    "        self.version = version",
    "",
    ...methods,
    "    def _call(self, method: str, template: str, path_parameters: list, values: dict, idempotency_key):",
    '        path = re.sub(r":(\\w+)", lambda m: urllib.parse.quote(str(values[m.group(1)]), safe=""), template)',
    "        rest = {k: v for k, v in values.items() if k not in path_parameters}",
    "        url = self.base_url + path",
    "        data = None",
    '        headers = {"accept": "application/json"}',
    '        if method == "GET":',
    "            query = {k: v if isinstance(v, str) else json.dumps(v) for k, v in rest.items() if v is not None}",
    "            if query:",
    '                url += "?" + urllib.parse.urlencode(query)',
    "        else:",
    '            data = json.dumps(rest).encode("utf-8")',
    '            headers["content-type"] = "application/json"',
    "        if self.token is not None:",
    '            headers["authorization"] = "Bearer " + self.token',
    "        if self.version is not None:",
    '            headers["stackra-version"] = self.version',
    "        if idempotency_key is not None:",
    '            headers["idempotency-key"] = idempotency_key',
    "        request = urllib.request.Request(url, data=data, headers=headers, method=method)",
    "        try:",
    "            with urllib.request.urlopen(request) as response:",
    "                text = response.read()",
    "                return json.loads(text) if text else None",
    "        except urllib.error.HTTPError as error:",
    "            text = error.read()",
    "            raise ApiError(error.code, json.loads(text) if text else None) from None",
    "",
  ].join("\n");
}

/** The PHP SDK: no dependency beyond the json and stream functions. */
function phpSdk(manifest: StackraManifest, operations: readonly Operation[]): string {
  const client = `${pascalCase(manifest.member)}Client`;
  const methods = operations.flatMap((operation) => [
    `    /** \`${operation.key}\`: ${operation.method} ${operation.path} */`,
    `    public function ${camelCase(operation.name)}(${operation.input === undefined ? "" : "array $input, "}?string $idempotencyKey = null): mixed`,
    "    {",
    `        return $this->call('${operation.method}', '${operation.path}', [${operation.pathParameters.map((name) => `'${name}'`).join(", ")}], ${operation.input === undefined ? "[]" : "$input"}, $idempotencyKey);`,
    "    }",
    "",
  ]);
  return [
    "<?php",
    "",
    `// ${GENERATED_NOTICE}; from stackra.manifest.json (the actions marked public)`,
    `// Purpose: the PHP SDK of ${manifest.package}: one method per public action.`,
    "// Boundary: json and stream functions only; a refusal throws ApiError with the envelope.",
    "",
    "declare(strict_types=1);",
    "",
    `namespace Stackra\\Sdk\\${pascalCase(manifest.member)};`,
    "",
    "final class ApiError extends \\RuntimeException",
    "{",
    "    public function __construct(public readonly int $status, public readonly mixed $body)",
    "    {",
    "        $code = is_array($body) ? (string) ($body['code'] ?? 'unknown') : 'unknown';",
    '        parent::__construct("{$status} {$code}");',
    "    }",
    "}",
    "",
    `/** The public API of ${manifest.member}. */`,
    `final class ${client}`,
    "{",
    "    public function __construct(",
    "        private readonly string $baseUrl,",
    "        private readonly ?string $token = null,",
    "        private readonly ?string $version = null,",
    "    ) {}",
    "",
    ...methods,
    "    private function call(string $method, string $template, array $pathParameters, array $values, ?string $idempotencyKey): mixed",
    "    {",
    "        $path = preg_replace_callback('/:(\\w+)/', fn ($m) => rawurlencode((string) $values[$m[1]]), $template);",
    "        $rest = array_diff_key($values, array_flip($pathParameters));",
    "        $url = rtrim($this->baseUrl, '/') . $path;",
    "        $headers = ['Accept: application/json'];",
    "        $content = null;",
    "        if ($method === 'GET') {",
    "            $query = array_map(fn ($v) => is_string($v) ? $v : json_encode($v), array_filter($rest, fn ($v) => $v !== null));",
    "            if ($query !== []) {",
    "                $url .= '?' . http_build_query($query);",
    "            }",
    "        } else {",
    "            $content = json_encode((object) $rest, JSON_THROW_ON_ERROR);",
    "            $headers[] = 'Content-Type: application/json';",
    "        }",
    "        if ($this->token !== null) {",
    "            $headers[] = 'Authorization: Bearer ' . $this->token;",
    "        }",
    "        if ($this->version !== null) {",
    "            $headers[] = 'Stackra-Version: ' . $this->version;",
    "        }",
    "        if ($idempotencyKey !== null) {",
    "            $headers[] = 'Idempotency-Key: ' . $idempotencyKey;",
    "        }",
    "        $http = ['method' => $method, 'header' => implode(\"\\r\\n\", $headers), 'ignore_errors' => true];",
    "        if ($content !== null) {",
    "            $http['content'] = $content;",
    "        }",
    "        $text = file_get_contents($url, false, stream_context_create(['http' => $http]));",
    "        $status = (int) explode(' ', $http_response_header[0] ?? 'HTTP/1.1 0')[1];",
    "        $body = $text === '' || $text === false ? null : json_decode($text, true);",
    "        if ($status < 200 || $status >= 300) {",
    "            throw new ApiError($status, $body);",
    "        }",
    "        return $body;",
    "    }",
    "}",
    "",
  ].join("\n");
}

/**
 * The SDK files of `manifest`; none when it marks no action public.
 *
 * @example
 * emitSdks(manifest).map((file) => file.path);
 * // [".stackra/sdks/typescript/index.ts", ".stackra/sdks/python/orders_client.py", ".stackra/sdks/php/OrdersClient.php"]
 */
export function emitSdks(manifest: StackraManifest): readonly GeneratedFile[] {
  const operations = publicOperations(manifest);
  if (operations.length === 0) return [];
  const schemas = isObject(manifest.schemas) ? manifest.schemas : {};
  return [
    {
      path: ".stackra/sdks/typescript/index.ts",
      content: typescriptSdk(manifest, operations, schemas),
    },
    {
      path: `.stackra/sdks/python/${snakeCase(manifest.member)}_client.py`,
      content: pythonSdk(manifest, operations),
    },
    {
      path: `.stackra/sdks/php/${pascalCase(manifest.member)}Client.php`,
      content: phpSdk(manifest, operations),
    },
  ];
}
