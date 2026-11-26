/**
 * Stackra file contract:
 * Purpose: `checkDeprecations`, gen's warnings over deprecations (ADR 0131 decision 4): `deprecated_use`, where a class
 *          of the member uses something deprecated (injects it, listens to it, extends it, names it as its partner or
 *          composes it as a trait with `Model.with`), its own or a dependency's or consumed service's from that
 *          manifest's `deprecations`; and `deprecation_past_sunset`, an own deprecation whose sunset release the
 *          member's version has reached, so it is due for removal.
 * Boundary: pure; warnings only, never a refusal: a deprecated API keeps working until its sunset. A class that is
 *           itself deprecated is not warned for its uses (it goes with them). A dated sunset is not compared with the
 *           clock here (gen is deterministic); the runtime meters dated use (ADR 0136 decision 4). A malformed
 *           deprecation is refused by the source reader (`deprecation_invalid`, `deprecation_window_short`,
 *           `deprecation_not_constant`). Runs in the full pass only.
 * Runtime: isomorphic
 * Governing contract: ADR 0131 (decision 4: gen warns on use); ADR 0136 (decision 4); ADR 0177 (decision 6); ADR 0294
 *                     (decision 26: a finding carries its fix); STA-340 (warnings); STA-2836.
 */
import { sunsetReached } from "@stackra/contracts";
import type { Deprecation, StackraManifest } from "@stackra/contracts";

import { CLIENTS_SPECIFIER } from "#core/constants/clients-specifier.constant";
import { serviceManifest } from "#core/functions/service-manifest.function";
import type { ClassRef } from "#core/types/class-ref.type";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** A deprecation found for a use: what it is, where it comes from, and its terms. */
interface Found {
  readonly label: string;
  readonly deprecation: Deprecation;
}

/** The kinds of a manifest's `deprecations` entry that name a class rather than a field or a trait. */
const MEMBER_KINDS: ReadonlySet<string> = new Set(["field", "setting", "trait"]);

/** The terms of a manifest entry, when it has them. */
const termsOf = (entry: Readonly<Record<string, unknown>>): Deprecation | undefined => {
  const { since, sunset, replacement } = entry;
  if (typeof since !== "string" || typeof sunset !== "string") return undefined;
  return { since, sunset, ...(typeof replacement === "string" ? { replacement } : {}) };
};

/** The deprecated entry of `manifest` for the class or trait `name`. */
const inManifest = (
  manifest: StackraManifest | undefined,
  name: string,
  trait: boolean,
): Deprecation | undefined => {
  const entry = (manifest?.deprecations ?? []).find(
    (candidate) =>
      candidate.name === name &&
      (trait ? candidate.kind === "trait" : !MEMBER_KINDS.has(candidate.kind)),
  );
  return entry === undefined ? undefined : termsOf(entry);
};

/** What to write instead, from the terms. */
const fixOf = (found: Found): string =>
  found.deprecation.replacement === undefined
    ? `stop using ${found.label} before ${found.deprecation.sunset}, when it is removed`
    : `use ${found.deprecation.replacement} instead of ${found.label} before ${found.deprecation.sunset}, when it is removed`;

/**
 * The deprecation warnings of `ir`.
 *
 * @example
 * checkDeprecations(ir).map((warning) => `${warning.code} ${warning.subject}`);
 * // ["deprecated_use ShipOnPaidListener", "deprecation_past_sunset LegacyOrder.amount"]
 */
export function checkDeprecations(ir: MemberIR): GenError[] {
  const own = new Map(
    ir.classes
      .filter((declared) => declared.deprecated !== undefined)
      .map((declared) => [`${declared.importPath}#${declared.name}`, declared]),
  );
  const ownTraits = new Map((ir.deprecatedTraits ?? []).map((trait) => [trait.name, trait]));
  const packages = [...ir.dependencies, ...(ir.contractsDependencies ?? [])];

  /** The deprecation of the class `ref` names, own, a package's or a consumed service's. */
  const classFound = (ref: ClassRef, ownBase = false): Found | undefined => {
    const mine = ownBase
      ? [...own.values()].find((declared) => declared.name === ref.name)
      : own.get(`${ref.from}#${ref.name}`);
    if (mine?.deprecated !== undefined) {
      const kind = mine.kind.replaceAll("_", " ");
      return {
        label: `${ref.name} (${/^[aeiou]/.test(kind) ? "an" : "a"} ${kind} of this member)`,
        deprecation: mine.deprecated,
      };
    }
    if (ref.from.startsWith(CLIENTS_SPECIFIER)) {
      const service = ref.from.slice(CLIENTS_SPECIFIER.length);
      const deprecation = inManifest(serviceManifest(ir, service), ref.name, false);
      return deprecation === undefined
        ? undefined
        : { label: `${ref.name} (of the ${service} service)`, deprecation };
    }
    const source = packages.find(
      (dependency) =>
        ref.from === dependency.package || ref.from.startsWith(`${dependency.package}/`),
    );
    const deprecation = inManifest(source?.manifest, ref.name, false);
    return deprecation === undefined || source === undefined
      ? undefined
      : { label: `${ref.name} (of ${source.package})`, deprecation };
  };

  /** The deprecation of the trait `name` composes, own or a package's. */
  const traitFound = (name: string): Found | undefined => {
    const mine = ownTraits.get(name);
    if (mine !== undefined)
      return { label: `the trait ${name} (of this member)`, deprecation: mine.deprecated };
    for (const dependency of packages) {
      const deprecation = inManifest(dependency.manifest, name, true);
      if (deprecation !== undefined)
        return { label: `the trait ${name} (of ${dependency.package})`, deprecation };
    }
    return undefined;
  };

  /** Each deprecated thing `declared` uses, once each, with how it uses it. */
  const usesOf = (declared: DeclaredClass): { readonly how: string; readonly found: Found }[] => {
    const uses: { readonly how: string; readonly found: Found }[] = [];
    const seen = new Set<string>();
    const add = (how: string, found: Found | undefined): void => {
      if (found === undefined || seen.has(found.label)) return;
      seen.add(found.label);
      uses.push({ how, found });
    };
    for (const dep of declared.deps) add("injects", classFound(dep.class));
    if (declared.handle?.event !== undefined) add("listens to", classFound(declared.handle.event));
    if (declared.base !== undefined) add("extends", classFound(declared.base, declared.base.own));
    if (declared.partner !== undefined) add("is the partner of", classFound(declared.partner));
    // `Model.with(SoftDeletes, HasPublicId("ord"))`: the trait's exported name.
    for (const trait of declared.traits) add("composes", traitFound(trait.name));
    return uses;
  };

  const warnings: GenError[] = [];
  for (const declared of ir.classes) {
    if (declared.deprecated !== undefined) continue;
    for (const { how, found } of usesOf(declared))
      warnings.push({
        code: "deprecated_use",
        file: declared.file,
        line: 0,
        column: 0,
        subject: declared.name,
        message: `${declared.name} ${how} ${found.label}, deprecated since ${found.deprecation.since}`,
        fix: fixOf(found),
        severity: "warning",
      });
  }

  // Own deprecations whose sunset release has come: due for removal in this release (ADR 0177 decision 6).
  const due = (subject: string, file: string, deprecation: Deprecation): void => {
    if (!sunsetReached(deprecation.sunset, ir.version)) return;
    warnings.push({
      code: "deprecation_past_sunset",
      file,
      line: 0,
      column: 0,
      subject,
      message: `${subject} was deprecated in ${deprecation.since} to be removed at ${deprecation.sunset}, and this member is at ${ir.version}`,
      fix: `remove ${subject}${deprecation.replacement === undefined ? "" : ` (its users move to ${deprecation.replacement})`}, and say so in the release note`,
      severity: "warning",
    });
  };
  for (const declared of own.values())
    if (declared.deprecated !== undefined) due(declared.name, declared.file, declared.deprecated);
  for (const shape of ir.shapes)
    for (const field of shape.fields)
      if (field.deprecated !== undefined)
        due(`${shape.name}.${field.name}`, shape.file, field.deprecated);
  for (const trait of ir.deprecatedTraits ?? []) due(trait.name, trait.file, trait.deprecated);
  return warnings;
}
