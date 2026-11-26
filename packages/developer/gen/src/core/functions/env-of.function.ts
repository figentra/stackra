/**
 * Stackra file contract:
 * Purpose: `envOf`, the `env` manifest section (ADR 0173 amendment 2026-11-04, decision 2): one row per environment
 *          variable the member's own configuration classes declare (`Config({ schema, env })` names and the schema's
 *          `@Secret` fields), with its kind (`secret`, `public` for a `VITE_`, `EXPO_PUBLIC_` or `RENDERER_VITE_` name,
 *          `config` otherwise), its type and rules, whether it is required, the per-environment refused prefixes and
 *          environments of a secret, and the config key and class that declare it. A service also takes the rows of
 *          every hosted package and an app only their `public` rows, marked `from`; a worker takes none. A row names
 *          no store location: runway reads a product's secrets from its sops scope `products/<project>/<env>` (ADR
 *          0525). A producer with a runway `events` block also lists its signing key's secret name, with the
 *          environments that name it (ADR 0511 decision 16).
 * Boundary: pure; names and rules only, never a default or a value, so ADR 0305 rule 34 holds. A host override of a
 *           package config adds no row (the package's row stands); an integration's or connection's `@Secret` is a
 *           tenant credential, not an environment variable, and adds none. Sorted by name, one row per name and
 *           `from`.
 * Runtime: isomorphic
 * Governing contract: ADR 0173 (amendment 2026-11-04); ADR 0146 as amended; ADR 0231 (decision 4: public prefixes);
 *                     STA-2104.
 */
import type { Json } from "@stackra/contracts";

import { configKeyOf } from "#core/functions/config-key-of.function";
import type { FieldIR } from "#core/types/field-ir.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { TypeDesc } from "#core/types/type-desc.type";

/** A manifest row. */
type Entry = { [key: string]: Json };

/** The public prefixes (`PUBLIC_ENV_PREFIXES` of @stackra/config, ADR 0231 decision 4). */
const PUBLIC = /^(?:VITE_|EXPO_PUBLIC_|RENDERER_VITE_)/;

/** The row's `type` and, for an enum, its `values`. */
function typeOf(type: TypeDesc): Entry {
  if (type.kind === "brand") return { type: type.brand };
  if (type.kind === "enum" || type.kind === "driver_name")
    return { type: "enum", values: [...type.values] };
  return { type: type.kind };
}

/** The rule and requirement facts of a field. */
function factsOf(field: FieldIR): Entry {
  return {
    ...typeOf(field.type),
    required: !field.optional && field.default === undefined,
    ...(field.rules.length > 0
      ? { rules: field.rules.map((rule) => ({ name: rule.name, options: rule.options as Json })) }
      : {}),
  };
}

/**
 * The `env` rows of `ir`.
 *
 * @param ir - the member read by discovery.
 * @returns the rows, sorted by name, then `from`.
 * @example
 * envOf(ir)[0];
 * // { name: "STACKRA_LOYALTY_KIT_LEDGER", kind: "config", type: "string", required: true, config: "loyalty_kit", … }
 */
export function envOf(ir: MemberIR): Entry[] {
  const rows: Entry[] = [];
  for (const declared of ir.classes) {
    if (declared.kind !== "config" || (declared.base !== undefined && !declared.base.own)) continue;
    const schema = declared.options["schema"] as { $class?: unknown } | undefined;
    const shape = ir.shapes.find((candidate) => candidate.name === schema?.$class);
    const owner = { config: configKeyOf(declared.name, ir.member), class: declared.name };
    const env = declared.options["env"];
    for (const [fieldName, name] of Object.entries(
      typeof env === "object" && env !== null ? env : {},
    )) {
      if (typeof name !== "string") continue;
      const field = shape?.fields.find((candidate) => candidate.name === fieldName);
      rows.push({
        name,
        kind: PUBLIC.test(name) ? "public" : "config",
        ...(field === undefined ? {} : factsOf(field)),
        ...owner,
        field: fieldName,
      });
    }
    for (const field of shape?.fields ?? []) {
      if (field.secret === undefined) continue;
      const { name, refuse, environments } = field.secret;
      rows.push({
        name,
        kind: "secret",
        ...factsOf(field),
        ...(refuse === undefined ? {} : { refuse: refuse as Json }),
        ...(environments === undefined ? {} : { environments: [...environments] }),
        ...owner,
        field: field.name,
      });
    }
  }
  // A producer's relay signing key, by the secret name each runway `events` block gives (ADR 0511 decision 16): a
  // secret its runtime needs, as an `@Secret` field's is, though `EventsRelayConfig.signingKey` holds only the name.
  const signingKeys = new Map<string, string[]>();
  for (const [environment, events] of Object.entries(ir.eventsRelay ?? {}))
    signingKeys.set(events.signingKey, [
      ...(signingKeys.get(events.signingKey) ?? []),
      environment,
    ]);
  for (const [name, environments] of signingKeys)
    rows.push({
      name,
      kind: "secret",
      type: "string",
      required: true,
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      environments: environments.sort(),
      config: "outbox.events_relay",
      class: "EventsRelayConfig",
      field: "signingKey",
    });
  if (ir.layout !== "package") {
    // A service hosts its packages' modules, so it needs their names; an app's bundle takes only public values
    // (decision 3); a Worker runs no module container, so it declares its own names only.
    for (const dependency of ir.layout === "worker" ? [] : ir.dependencies) {
      if (dependency.manifest["kind"] === "app") continue;
      for (const row of (dependency.manifest["env"] ?? []) as unknown as readonly Entry[])
        if (ir.layout === "service" || row["kind"] === "public")
          rows.push({ ...row, from: row["from"] ?? dependency.package });
    }
  }
  const seen = new Set<string>();
  return (
    rows
      .filter((row) => {
        const key = `${String(row["name"])} ${String(row["from"] ?? "")}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort((left, right) =>
        `${String(left["name"])} ${String(left["from"] ?? "")}` <
        `${String(right["name"])} ${String(right["from"] ?? "")}`
          ? -1
          : 1,
      )
  );
}
