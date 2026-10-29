#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the licence check for agent skills and plugins (STA-272). Every skill folder under `.agents/skills` and
 *          `.agents/reference` and every plugin enabled in `.claude/settings.json` must have a licence recorded in
 *          `.agents/skills/.licences.yaml`, and that licence must be on the allowlist. A licence file in a skill folder
 *          that reads as noncommercial fails even when the record says otherwise.
 * Boundary: reads the checkout; writes nothing. `pnpm validate` runs it through its `node --test` step.
 * Runtime: node
 * Governing contract: ADR 0174 (licence allow-list); ADR 0258 (agent skills); ADR 0007 (source documentation standard).
 * Scope: tools/scripts/*.mjs · Owner: release-operations · Secrets: forbidden
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { parse } from "yaml";

/** Licences a skill or plugin may carry: permissive, commercial use allowed. */
export const ALLOWED_LICENCES = Object.freeze([
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
]);

const RECORD = ".agents/skills/.licences.yaml";
const SKILL_ROOTS = [".agents/skills", ".agents/reference"];
const NONCOMMERCIAL = /noncommercial|non-commercial|polyform/i;

/** Skill folders (holding a SKILL.md) under `dir`, as paths relative to `.agents`. */
function skillFolders(root, dir) {
  const abs = join(root, dir);
  if (!existsSync(abs)) return [];
  if (existsSync(join(abs, "SKILL.md"))) return [dir.replace(/^\.agents\//, "")];
  return readdirSync(abs, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .flatMap((d) => skillFolders(root, `${dir}/${d.name}`));
}

/** Findings for the checkout at `root`; empty when every skill and plugin carries an allowed licence. */
export function checkLicences(root) {
  const recordPath = join(root, RECORD);
  if (!existsSync(recordPath)) return [`${RECORD} is missing`];
  const record = parse(readFileSync(recordPath, "utf8")) ?? {};
  const settingsPath = join(root, ".claude/settings.json");
  const enabled = existsSync(settingsPath)
    ? Object.entries(JSON.parse(readFileSync(settingsPath, "utf8")).enabledPlugins ?? {})
        .filter(([, on]) => on)
        .map(([id]) => id)
    : [];
  const findings = [];
  const judge = (kind, name, licence) => {
    if (!licence) findings.push(`${kind} ${name}: no licence recorded in ${RECORD}`);
    else if (!ALLOWED_LICENCES.includes(licence))
      findings.push(
        `${kind} ${name}: licence ${licence} is not allowed (${ALLOWED_LICENCES.join(", ")})`,
      );
  };

  const skills = SKILL_ROOTS.flatMap((dir) => skillFolders(root, dir));
  for (const skill of skills) {
    judge("skill", skill, record.skills?.[skill]);
    for (const file of readdirSync(join(root, ".agents", skill)).filter((f) =>
      /^(licen[cs]e|copying)/i.test(f),
    ))
      if (NONCOMMERCIAL.test(readFileSync(join(root, ".agents", skill, file), "utf8")))
        findings.push(`skill ${skill}: ${file} reads as a noncommercial licence`);
  }
  for (const plugin of enabled) judge("plugin", plugin, record.plugins?.[plugin]);

  for (const stale of Object.keys(record.skills ?? {}).filter((s) => !skills.includes(s)))
    findings.push(`skill ${stale}: recorded in ${RECORD} but no such skill folder`);
  for (const stale of Object.keys(record.plugins ?? {}).filter((p) => !enabled.includes(p)))
    findings.push(`plugin ${stale}: recorded in ${RECORD} but not enabled`);
  return findings;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const findings = checkLicences(fileURLToPath(new URL("../../", import.meta.url)));
  for (const f of findings) console.error(`skill-licences: ${f}`);
  if (findings.length) process.exit(1);
  console.log("skill-licences: every skill and enabled plugin carries an allowed licence");
}
