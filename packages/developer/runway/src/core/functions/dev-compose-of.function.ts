/**
 * Stackra file contract:
 * Purpose: `devComposeOf(input)`, the dev compose of one lane from the root runway's `environments.dev.infra`: every
 *          block that is not Encore's own (`gateway`, `postgres`) becomes one Compose service of its kind
 *          (`DEV_INFRA_KINDS`, or a block that spells its own `containerPorts`), published on 127.0.0.1 at the block's
 *          ports moved by lane × `lanes.portStep`; a `perLane: false` block (ClamAV's default) goes to the project
 *          every lane shares, unmoved; a `when: opt-in` block starts only when asked, under its own profile. It also
 *          returns the variables a member's local run gets to reach them (`*_VALKEY_URL`, `AWS_ENDPOINT_URL_S3`, …).
 * Boundary: pure. Every port is written in the runway (a missing one is refused, so `checkPorts` sees them all) and
 *           every image is the runway's; an image without a digest is a warning, not a refusal. Any refusal returns no
 *           file. No credential is planned: every kind runs without one on the loopback interface.
 * Runtime: isomorphic
 * Governing contract: ADR 0199 (decision 3: `stackra dev` runs gen, `encore run` and a small compose file); ADR 0296
 *                     (decision 1: dev ports and lanes); ADR 0170 (a port is written once); STA-2664 (item 6).
 */
import { DEV_INFRA_KINDS } from "#core/constants/dev-infra-kinds.constant";
import type { ComposeDocument } from "#core/types/compose-document.type";
import type { ComposeService } from "#core/types/compose-service.type";
import type { DevComposeInput } from "#core/types/dev-compose-input.type";
import type { DevComposePlan } from "#core/types/dev-compose-plan.type";
import type { DevInfraIssue } from "#core/types/dev-infra-issue.type";
import type { DevInfraKind } from "#core/types/dev-infra-kind.type";
import type { DevInfraService } from "#core/types/dev-infra-service.type";

/** The infra blocks `encore run` serves itself. */
const ENCORE_OWNED = new Set(["gateway", "postgres"]);

/** Where every container is published. */
const HOST = "127.0.0.1";

/** The highest TCP port. */
const MAX_PORT = 65_535;

/** An image pinned by digest. */
const PINNED = /@sha256:[\da-f]{64}$/;

/** An S3 bucket name. */
const BUCKET = /^[\da-z][\d.a-z-]{1,61}[\da-z]$/;

/** A template field: `{host}`, `{port}`, `{port:<field>}`. */
const TEMPLATE = /\{(host|port)(?::([A-Za-z]+))?\}/g;

/** The Compose files of one plan, before they are named. */
type Files = {
  services: Record<string, ComposeService>;
  volumes: Record<string, Record<string, never>>;
};

/** A string record, or undefined when `value` is not one. */
function strings(value: unknown): Record<string, string> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const entries = Object.entries(value);
  return entries.every(([, item]) => typeof item === "string")
    ? (Object.fromEntries(entries) as Record<string, string>)
    : undefined;
}

/** The kind a block that names no known kind spells itself (`containerPorts`, `scheme`, `command`, `environment`). */
function ownKind(block: Readonly<Record<string, unknown>>): DevInfraKind | undefined {
  const ports = block["containerPorts"];
  if (typeof ports !== "object" || ports === null || Array.isArray(ports)) return undefined;
  const entries = Object.entries(ports);
  if (entries.length === 0 || !entries.every(([, port]) => Number.isInteger(port)))
    return undefined;
  const command = block["command"];
  const environment = strings(block["environment"]);
  return {
    ports: Object.fromEntries(entries) as Record<string, number>,
    primary: entries.some(([field]) => field === "port")
      ? "port"
      : (entries[0] as [string, number])[0],
    scheme: typeof block["scheme"] === "string" ? block["scheme"] : "tcp",
    perLane: true,
    ...(Array.isArray(command) && command.every((part) => typeof part === "string")
      ? { command: command as string[] }
      : {}),
    ...(environment === undefined ? {} : { environment }),
  };
}

/** `template` with its fields filled from `ports`. */
function fill(template: string, ports: Readonly<Record<string, number>>, primary: string): string {
  return template.replaceAll(TEMPLATE, (_match, what: string, field: string | undefined) =>
    what === "host" ? HOST : String(ports[field ?? primary]),
  );
}

/** A Compose project name from `text`: lower case, letters, digits, `-` and `_`. */
function projectName(text: string): string {
  const name = text
    .toLowerCase()
    .replaceAll(/[^\d_a-z-]+/g, "-")
    .replace(/^[^\da-z]+/, "")
    .replace(/-+$/, "");
  return name === "" ? "stackra" : name;
}

/** The Compose document named `name` holding `files`. */
function documentOf(name: string, files: Files): ComposeDocument {
  return Object.keys(files.volumes).length === 0
    ? { name, services: files.services }
    : { name, services: files.services, volumes: files.volumes };
}

/**
 * The dev compose of `input.lane`.
 *
 * @param input - the product key, the root runway's dev `infra` and `lanes`, the lane and the opt-ins asked for.
 * @example
 * devComposeOf({ project: "acme", infra: { valkey: { image: "valkey/valkey:8.1@sha256:…", port: 6379 } }, lane: 0 });
 * // { lane: { name: "acme-dev-lane-0", services: { valkey: { ports: ["127.0.0.1:6379:6379"], … } } },
 * //   env: { CACHE_VALKEY_URL: "redis://127.0.0.1:6379", … }, issues: [], … }
 */
export function devComposeOf(input: DevComposeInput): DevComposePlan {
  const step = input.lanes?.enabled === false ? 0 : (input.lanes?.portStep ?? 0);
  const asked = new Set(input.optIn ?? []);
  const issues: DevInfraIssue[] = [];
  const warnings: string[] = [];
  const services: DevInfraService[] = [];
  const env: Record<string, string> = {};
  const owners = new Map<string, string>();
  const optIns = new Set<string>();
  const lane: Files = { services: {}, volumes: {} };
  const shared: Files = { services: {}, volumes: {} };

  for (const [name, block] of Object.entries(input.infra ?? {})) {
    const kindName = typeof block["kind"] === "string" ? block["kind"] : name;
    if (ENCORE_OWNED.has(kindName)) continue;
    const refuse = (code: DevInfraIssue["code"], message: string): void => {
      issues.push({ code, service: name, message });
    };
    const kind = Object.hasOwn(DEV_INFRA_KINDS, kindName)
      ? DEV_INFRA_KINDS[kindName]
      : ownKind(block);
    if (kind === undefined) {
      refuse(
        "infra_kind_unknown",
        `${name}: no dev infra kind "${kindName}" (known: ${Object.keys(DEV_INFRA_KINDS).join(", ")}); set \`kind\`, or spell \`containerPorts\` ({ port: <the container's port> })`,
      );
      continue;
    }
    const image = block["image"];
    if (typeof image !== "string" || image === "") {
      refuse(
        "infra_image_missing",
        `${name}: set \`image\`, pinned by digest (<repository>:<tag>@sha256:<digest>)`,
      );
      continue;
    }
    if (!PINNED.test(image))
      warnings.push(
        `${name}: ${image} is not pinned by digest; add @sha256:<digest> so every machine runs the same image`,
      );
    const when = block["when"] ?? "always";
    if (when !== "always" && when !== "opt-in") {
      refuse("infra_when_invalid", `${name}.when: expected always or opt-in`);
      continue;
    }
    const isShared = typeof block["perLane"] === "boolean" ? !block["perLane"] : !kind.perLane;
    const shift = isShared ? 0 : input.lane * step;

    const ports: Record<string, number> = {};
    let valid = true;
    for (const [field, inside] of Object.entries(kind.ports)) {
      const value = block[field];
      if (value === undefined) {
        refuse(
          "infra_port_missing",
          `${name}.${field}: set the host port (the container listens on ${inside})`,
        );
        valid = false;
      } else if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < 1 ||
        value > MAX_PORT
      ) {
        refuse("infra_port_invalid", `${name}.${field}: expected a port from 1 to ${MAX_PORT}`);
        valid = false;
      } else if (value + shift > MAX_PORT) {
        refuse(
          "infra_port_invalid",
          `${name}.${field}: lane ${input.lane} moves ${value} to ${value + shift}, above ${MAX_PORT}`,
        );
        valid = false;
      } else ports[field] = value + shift;
    }

    const buckets = block["buckets"];
    let bucketList: string[] = [];
    if (buckets !== undefined) {
      if (kind.buckets === undefined) {
        refuse("infra_bucket_invalid", `${name}: ${kindName} takes no buckets`);
        valid = false;
      } else if (
        !Array.isArray(buckets) ||
        !buckets.every((bucket) => typeof bucket === "string" && BUCKET.test(bucket))
      ) {
        refuse(
          "infra_bucket_invalid",
          `${name}.buckets: expected a list of S3 bucket names (3 to 63 of a-z, 0-9, '.' and '-')`,
        );
        valid = false;
      } else bucketList = buckets as string[];
    }
    if (!valid) continue;

    const optIn = when === "opt-in";
    if (optIn) optIns.add(name);
    services.push({
      name,
      kind: kindName,
      shared: isShared,
      optIn,
      ports,
      port: ports[kind.primary] as number,
      url: `${kind.scheme}://${HOST}:${ports[kind.primary]}`,
    });

    const last = bucketList.at(-1);
    const command = [
      ...(kind.command ?? []),
      ...(kind.buckets !== undefined && bucketList.length > 0
        ? [`${kind.buckets.argument}${bucketList.join(",")}`]
        : []),
    ];
    const check = kind.healthcheck;
    const files = isShared ? shared : lane;
    const volume = `${name}-data`;
    files.services[name] = {
      image,
      restart: "unless-stopped",
      ports: Object.entries(kind.ports).map(
        ([field, inside]) => `${HOST}:${ports[field]}:${inside}`,
      ),
      ...(kind.environment === undefined ? {} : { environment: kind.environment }),
      ...(command.length === 0 ? {} : { command }),
      ...(kind.volume === undefined ? {} : { volumes: [`${volume}:${kind.volume}`] }),
      ...(check === undefined
        ? {}
        : {
            healthcheck: {
              test:
                last !== undefined && kind.buckets !== undefined
                  ? kind.buckets.probe.map((part) => part.replace("{bucket}", last))
                  : check.test,
              interval: check.interval,
              timeout: check.timeout,
              retries: check.retries,
              start_period: check.startPeriod,
            },
          }),
      ...(optIn ? { profiles: [name] } : {}),
    };
    if (kind.volume !== undefined) files.volumes[volume] = {};

    for (const [variable, template] of Object.entries(kind.memberEnv ?? {})) {
      const first = owners.get(variable);
      if (first !== undefined) {
        refuse(
          "infra_env_conflict",
          `${first} and ${name} both give ${variable}; keep one of them, or move one to another lane`,
        );
        continue;
      }
      owners.set(variable, name);
      if (!optIn || asked.has(name)) env[variable] = fill(template, ports, kind.primary);
    }
    if (kindName === "clamav" && ports["port"] !== DEV_INFRA_KINDS["clamav"]?.ports["port"])
      warnings.push(
        `${name}: clamd answers on ${HOST}:${ports["port"]}, and MediaConfig's \`clamav.port\` defaults to 3310: set it to ${ports["port"]} in the member's media config`,
      );
  }

  for (const name of asked)
    if (!optIns.has(name))
      issues.push({
        code: "infra_opt_in_unknown",
        service: name,
        message: `--infra ${name}: no dev infra block named ${name} has \`when: opt-in\` (opt-in: ${[...optIns].join(", ") || "none"})`,
      });

  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const provides = [...owners.keys()].sort();
  if (issues.length > 0) return { services, env: {}, provides, issues, warnings };
  const base = projectName(input.project);
  return {
    ...(Object.keys(lane.services).length === 0
      ? {}
      : { lane: documentOf(`${base}-dev-lane-${input.lane}`, lane) }),
    ...(Object.keys(shared.services).length === 0
      ? {}
      : { shared: documentOf(`${base}-dev-shared`, shared) }),
    services,
    env,
    provides,
    issues,
    warnings,
  };
}
