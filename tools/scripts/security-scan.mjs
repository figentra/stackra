#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm security:sast` and `pnpm security:dast` (STA-2821), the repository's own application security tests
 *          beside GitHub's CodeQL default setup (which scans every pull request and main on GitHub's side).
 *          - `sast [--test] [--local] [--sarif <file>] [--update-baseline --reason <text> --issue STA-n]`: runs the
 *            Stackra Semgrep rules (`tools/security/semgrep/rules`) over apps, packages, services and workers. A finding
 *            whose fingerprint is in `tools/security/semgrep/baseline.yaml` is known; any other fails the run. `--test`
 *            runs the rules against their fixtures instead (`semgrep --test`).
 *          - `dast --target <name|url> [--mode baseline|full|api] [--api <spec url>] [--minutes <n>] [--out <dir>]
 *            [--sarif <file>]`: runs OWASP ZAP against a target and gates its JSON report with
 *            `tools/security/zap/policy.tsv` (ZAP's own rules format). The passive `baseline` may scan a host named in
 *            `tools/security/zap/targets.yaml` or a local one; the active `full` and `api` scans only a local or private
 *            host, or a listed target marked `active: true`. Any other host is refused: we never attack what we do not own.
 *          Both run their tool from a Docker image pinned by digest (`--local` uses a `semgrep` on PATH instead), so the
 *          same command runs in CI and on the test box.
 * Boundary: reads the checkout (mounted read-only into Semgrep); writes only `--out`, `--sarif` and, with
 *           `--update-baseline`, the baseline file. DAST sends requests only to the target it was given.
 * Runtime: node (Docker on PATH, or `STACKRA_DOCKER` naming the binary)
 * Governing contract: ADR 0187 decision 3 (nightly ZAP scan); ADR 0450 decision 3 (egress); ADR 0019 (pinned tools).
 * Secrets: none read or printed. A target needing a sign-in is out of scope here (no credential is passed to ZAP).
 * Exit codes: 0 clean (known findings and warnings only), 1 a new finding or a FAIL alert, 2 usage, a refused target or a
 *             tool failure.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse, stringify } from "yaml";

/** Semgrep CE 1.184.0 (2026-11-05), non-root image, pinned by its index digest (ADR 0019). */
export const SEMGREP_IMAGE =
  "semgrep/semgrep:1.184.0-nonroot@sha256:f62960e8bc7c3d6bf2f5acebdb8e25add95e1efbc93a479c3ed3d5366619ac24";
/** OWASP ZAP 2.17.0 stable (2026-11-03), pinned by its index digest. */
export const ZAP_IMAGE =
  "zaproxy/zap-stable:2.17.0@sha256:9624669db72f54d86c4b46a7064518bd9bf79d8c61a4c31befa9923489f328af";

export const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
export const RULES_DIR = "tools/security/semgrep/rules";
export const FIXTURES_DIR = "tools/security/semgrep/__tests__/__fixtures__";
export const BASELINE_PATH = "tools/security/semgrep/baseline.yaml";
export const POLICY_PATH = "tools/security/zap/policy.tsv";
export const TARGETS_PATH = "tools/security/zap/targets.yaml";
/** What the SAST scan reads: the members' code. Tests, fixtures and generated output are not shipped code. */
export const SCAN_PATHS = ["apps", "packages", "services", "workers"];
export const SCAN_EXCLUDES = [
  "__tests__",
  "__fixtures__",
  "node_modules",
  "dist",
  ".stackra",
  ".turbo",
  "*.d.ts",
  "*.test.ts",
  "*.test.tsx",
  "*.e2e.test.ts",
];
const MODES = ["baseline", "full", "api"];
const ISSUE = /^STA-\d+$/;
const USAGE = `usage:
  security-scan.mjs sast [--test] [--local] [--sarif <file>]
  security-scan.mjs sast --update-baseline --reason <text> --issue STA-n [--local]
  security-scan.mjs dast --target <name|url> [--mode baseline|full|api] [--api <spec url>] [--minutes <n>]
                         [--out <dir>] [--sarif <file>]`;

/** A usage or policy refusal: exit 2 with the message. */
export class UsageError extends Error {}

/** The parsed command line, or a thrown UsageError. */
export function parseArgs(argv) {
  const [command, ...rest] = argv;
  if (command !== "sast" && command !== "dast") throw new UsageError(USAGE);
  const flags = new Set(["--test", "--local", "--update-baseline"]);
  const values = new Set([
    "--sarif",
    "--reason",
    "--issue",
    "--target",
    "--mode",
    "--api",
    "--minutes",
    "--out",
  ]);
  const options = { command };
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (flags.has(arg)) options[arg.slice(2)] = true;
    else if (values.has(arg)) {
      const value = rest[(i += 1)];
      if (value === undefined || value.startsWith("--"))
        throw new UsageError(`${arg} needs a value\n${USAGE}`);
      options[arg.slice(2)] = value;
    } else throw new UsageError(`unknown argument ${arg}\n${USAGE}`);
  }
  const allowed =
    command === "sast"
      ? ["command", "test", "local", "sarif", "update-baseline", "reason", "issue"]
      : ["command", "target", "mode", "api", "minutes", "out", "sarif"];
  const stray = Object.keys(options).find((key) => !allowed.includes(key));
  if (stray !== undefined)
    throw new UsageError(`--${stray} does not apply to ${command}\n${USAGE}`);
  if (command === "sast" && options["update-baseline"]) {
    if (!options.reason?.trim())
      throw new UsageError("--update-baseline needs --reason <why these are accepted>");
    if (!ISSUE.test(options.issue ?? ""))
      throw new UsageError("--update-baseline needs --issue STA-n");
  }
  if (command === "dast") {
    if (options.target === undefined) throw new UsageError(`dast needs --target\n${USAGE}`);
    options.mode ??= "baseline";
    if (!MODES.includes(options.mode)) throw new UsageError(`--mode is one of ${MODES.join(", ")}`);
    if (options.mode === "api" && options.api === undefined)
      throw new UsageError("--mode api needs --api <spec url>");
    if (options.mode !== "api" && options.api !== undefined)
      throw new UsageError("--api applies to --mode api only");
    options.minutes = Number(options.minutes ?? 2);
    if (!Number.isInteger(options.minutes) || options.minutes < 1 || options.minutes > 60)
      throw new UsageError("--minutes is a whole number from 1 to 60");
  }
  return options;
}

// ---------------------------------------------------------------------------------------------------------------- SAST

/** The matched source text of a Semgrep result, whitespace collapsed (line numbers are not part of a fingerprint). */
export function matchedText(source, result) {
  const lines = source.split("\n").slice(result.start.line - 1, result.end.line);
  return lines.join("\n").replaceAll(/\s+/g, " ").trim();
}

/**
 * Each result with its `fingerprint`: sha256 of the rule, the path and the matched text, plus the ordinal among identical
 * matches in the file, so moving code keeps a finding known and a second copy of the same line is new.
 */
export function fingerprintResults(results, readSource) {
  const seen = new Map();
  const sources = new Map();
  return results.map((result) => {
    if (!sources.has(result.path)) sources.set(result.path, readSource(result.path));
    const text = matchedText(sources.get(result.path), result);
    const key = `${result.check_id}\n${result.path}\n${text}`;
    const ordinal = seen.get(key) ?? 0;
    seen.set(key, ordinal + 1);
    const fingerprint = createHash("sha256")
      .update(`${key}\n${ordinal}`)
      .digest("hex")
      .slice(0, 32);
    return { ...result, rule: ruleName(result.check_id), text, fingerprint };
  });
}

/** `stackra.sql-interpolated-string` from Semgrep's path-qualified id (`tools.security.semgrep.rules.stackra.…`). */
export function ruleName(checkId) {
  const at = checkId.indexOf("stackra.");
  return at === -1 ? checkId : checkId.slice(at);
}

/** The baseline file's entries; an empty list when the file is missing. */
export function readBaseline(text) {
  if (text === undefined) return [];
  const data = parse(text) ?? {};
  const findings = data.findings ?? [];
  if (!Array.isArray(findings)) throw new UsageError(`${BASELINE_PATH}: findings must be a list`);
  for (const entry of findings) {
    for (const field of ["rule", "path", "fingerprint", "reason", "issue"])
      if (typeof entry?.[field] !== "string" || entry[field].trim() === "")
        throw new UsageError(
          `${BASELINE_PATH}: every finding needs ${field} (${JSON.stringify(entry)})`,
        );
    if (!ISSUE.test(entry.issue))
      throw new UsageError(`${BASELINE_PATH}: ${entry.issue} is not an STA key`);
  }
  return findings;
}

/** `{ known, fresh, stale }`: findings in the baseline, findings not in it, and baseline entries no longer found. */
export function gateSemgrep(findings, baseline) {
  const accepted = new Set(baseline.map((entry) => entry.fingerprint));
  const found = new Set(findings.map((finding) => finding.fingerprint));
  return {
    known: findings.filter((finding) => accepted.has(finding.fingerprint)),
    fresh: findings.filter((finding) => !accepted.has(finding.fingerprint)),
    stale: baseline.filter((entry) => !found.has(entry.fingerprint)),
  };
}

/** The baseline file text for `findings`, keeping the reason and issue of entries already accepted. */
export function writeBaselineText(findings, baseline, reason, issue) {
  const previous = new Map(baseline.map((entry) => [entry.fingerprint, entry]));
  const entries = findings
    .map((finding) => ({
      rule: finding.rule,
      path: finding.path,
      fingerprint: finding.fingerprint,
      reason: previous.get(finding.fingerprint)?.reason ?? reason,
      issue: previous.get(finding.fingerprint)?.issue ?? issue,
    }))
    .toSorted(
      (a, b) =>
        a.path.localeCompare(b.path) ||
        a.rule.localeCompare(b.rule) ||
        a.fingerprint.localeCompare(b.fingerprint),
    );
  const header = `# Stackra file contract:
# Purpose: the Semgrep findings accepted when a Stackra rule landed, each a fingerprint (rule, path, matched text) with
#          the reason it is accepted and the issue that reviews it. \`pnpm security:sast\` fails on any finding not listed;
#          a fixed finding drops out on the next \`--update-baseline\`. Written by
#          \`node tools/scripts/security-scan.mjs sast --update-baseline --reason <text> --issue STA-n\`; never hand-edited
#          except to sharpen a reason.
# Scope: tools/security/semgrep/rules over apps, packages, services, workers
# Owner: release-operations
# Secrets: forbidden
`;
  return `${header}${stringify({ findings: entries }, { lineWidth: 0 })}`;
}

const SARIF_SCHEMA = "https://json.schemastore.org/sarif-2.1.0.json";
const SEMGREP_LEVEL = { ERROR: "error", WARNING: "warning", INFO: "note" };

/** SARIF 2.1.0 for code scanning: one run, a rule per Stackra rule, `baselineState` new or unchanged. */
export function semgrepSarif(gate, version) {
  const all = [...gate.known.map((f) => [f, "unchanged"]), ...gate.fresh.map((f) => [f, "new"])];
  const rules = new Map();
  for (const [finding] of all)
    if (!rules.has(finding.rule))
      rules.set(finding.rule, {
        id: finding.rule,
        name: finding.rule,
        shortDescription: { text: finding.rule },
        fullDescription: { text: finding.extra.message },
        defaultConfiguration: { level: SEMGREP_LEVEL[finding.extra.severity] ?? "warning" },
        properties: {
          tags: ["security", ...(finding.extra.metadata?.cwe ?? [])],
          ...(finding.extra.metadata?.impact === "HIGH" ? { "security-severity": "7.5" } : {}),
        },
      });
  return {
    $schema: SARIF_SCHEMA,
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "Semgrep (Stackra rules)",
            version,
            informationUri: "https://semgrep.dev",
            rules: [...rules.values()],
          },
        },
        results: all.map(([finding, baselineState]) => ({
          ruleId: finding.rule,
          level: SEMGREP_LEVEL[finding.extra.severity] ?? "warning",
          message: { text: finding.extra.message },
          baselineState,
          partialFingerprints: { "stackraFingerprint/v1": finding.fingerprint },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: finding.path },
                region: {
                  startLine: finding.start.line,
                  startColumn: finding.start.col,
                  endLine: finding.end.line,
                  endColumn: finding.end.col,
                },
              },
            },
          ],
        })),
      },
    ],
  };
}

/** The docker (or local semgrep) argv for a scan or a rule test. Source mounted read-only, no network metrics. */
export function semgrepCommand({ test, local, root }) {
  const args = test
    ? ["--test", "--config", RULES_DIR, FIXTURES_DIR]
    : [
        "scan",
        "--config",
        RULES_DIR,
        "--metrics=off",
        "--disable-version-check",
        "--json",
        "--quiet",
        ...SCAN_EXCLUDES.flatMap((pattern) => ["--exclude", pattern]),
        ...SCAN_PATHS,
      ];
  if (local) return { file: "semgrep", args, cwd: root };
  return {
    file: dockerBinary(),
    args: [
      "run",
      "--rm",
      "--network",
      "none",
      "-v",
      `${root}:/src:ro`,
      "-w",
      "/src",
      SEMGREP_IMAGE,
      "semgrep",
      ...args,
    ],
    cwd: root,
  };
}

function dockerBinary() {
  return process.env.STACKRA_DOCKER || "docker";
}

function run(command, io) {
  const result = spawnSync(command.file, command.args, {
    cwd: command.cwd,
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw new UsageError(`${command.file}: ${result.error.message}`);
  if (io.verbose && result.stderr) io.err(result.stderr);
  return result;
}

/** `sast`: the rule tests, a gated scan, or a baseline rewrite. Returns the exit code. */
export function runSast(options, io = defaultIo(), root = ROOT) {
  if (options.test) {
    const result = run(semgrepCommand({ test: true, local: options.local, root }), io);
    io.out(result.stdout);
    // Semgrep's progress goes to stderr; show it only when the fixtures fail, where it carries the rule errors.
    if (result.status !== 0) io.err(result.stderr);
    return result.status === 0 ? 0 : 1;
  }
  const result = run(semgrepCommand({ test: false, local: options.local, root }), io);
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    io.err(result.stderr);
    throw new UsageError(`semgrep exited ${result.status} without a JSON report`);
  }
  if (result.status !== 0 && result.status !== 1) {
    io.err(result.stderr);
    throw new UsageError(`semgrep exited ${result.status}`);
  }
  const ruleErrors = (report.errors ?? []).filter((error) => /rule/i.test(String(error.type)));
  if (ruleErrors.length > 0)
    throw new UsageError(`semgrep rule errors: ${JSON.stringify(ruleErrors)}`);
  const parseErrors = (report.errors ?? []).length;
  const findings = fingerprintResults(report.results ?? [], (path) =>
    readFileSync(join(root, path), "utf8"),
  );
  const baselineFile = join(root, BASELINE_PATH);
  const baseline = readBaseline(
    existsSync(baselineFile) ? readFileSync(baselineFile, "utf8") : undefined,
  );

  if (options["update-baseline"]) {
    writeFileSync(
      baselineFile,
      writeBaselineText(findings, baseline, options.reason.trim(), options.issue),
    );
    io.out(`${BASELINE_PATH}: ${findings.length} finding(s) accepted\n`);
    return 0;
  }

  const gate = gateSemgrep(findings, baseline);
  if (options.sarif) writeJson(options.sarif, semgrepSarif(gate, report.version ?? "unknown"));
  const scanned = report.paths?.scanned?.length ?? 0;
  io.out(
    `semgrep: ${scanned} files, ${findings.length} finding(s): ${gate.known.length} known, ${gate.fresh.length} new` +
      `${parseErrors ? `, ${parseErrors} file(s) not fully parsed` : ""}\n`,
  );
  for (const finding of gate.fresh)
    io.out(
      `NEW ${finding.rule} ${finding.path}:${finding.start.line}\n    ${finding.text.slice(0, 160)}\n    ${finding.extra.message.trim()}\n`,
    );
  if (gate.stale.length > 0)
    io.out(
      `${gate.stale.length} baseline entr${gate.stale.length === 1 ? "y is" : "ies are"} fixed; prune them with --update-baseline\n`,
    );
  if (gate.fresh.length > 0)
    io.out(
      "Fix each new finding, or (only when it is a false positive) add `// nosemgrep: <rule> -- <reason>` above it.\n",
    );
  return gate.fresh.length > 0 ? 1 : 0;
}

// ---------------------------------------------------------------------------------------------------------------- DAST

/** ZAP's rules file: `<plugin ids>\t<IGNORE|INFO|WARN|FAIL|OUTOFSCOPE>\t<note or url regex>`; `#` lines are comments. */
export function parseZapPolicy(text) {
  const levels = new Map();
  const outOfScope = new Map();
  for (const [index, raw] of text.split("\n").entries()) {
    const line = raw.replace(/\r$/, "");
    if (line.startsWith("#") || line.trim() === "") continue;
    const parts = line.split("\t");
    if (parts.length < 3)
      throw new UsageError(`${POLICY_PATH}:${index + 1}: three tab-separated fields expected`);
    const [ids, level, rest] = parts;
    if (level === "OUTOFSCOPE") {
      // ZAP matches from the start of the URL (Python's re.match); anchor so both agree.
      for (const id of ids.split(","))
        outOfScope.set(id, [...(outOfScope.get(id) ?? []), new RegExp(`^(?:${rest})`)]);
    } else if (["IGNORE", "INFO", "WARN", "FAIL"].includes(level)) {
      if (!/^\d+$/.test(ids))
        throw new UsageError(`${POLICY_PATH}:${index + 1}: one numeric plugin id expected`);
      levels.set(ids, level);
    } else throw new UsageError(`${POLICY_PATH}:${index + 1}: unknown level ${level}`);
  }
  return { levels, outOfScope };
}

/** The level of an alert the policy does not name: a High fails, a Medium warns, the rest inform. */
export function defaultLevel(riskcode) {
  return Number(riskcode) >= 3 ? "FAIL" : Number(riskcode) === 2 ? "WARN" : "INFO";
}

/** `{ alerts: [{ pluginid, name, risk, level, uris }], failed }` from ZAP's traditional JSON report and the policy. */
export function gateZap(report, policy) {
  const alerts = [];
  for (const site of report.site ?? []) {
    for (const alert of site.alerts ?? []) {
      const id = String(alert.pluginid);
      const level = policy.levels.get(id) ?? defaultLevel(alert.riskcode);
      if (level === "IGNORE") continue;
      const scopes = [...(policy.outOfScope.get(id) ?? []), ...(policy.outOfScope.get("*") ?? [])];
      const uris = (alert.instances ?? [])
        .map((instance) => instance.uri)
        .filter((uri) => !scopes.some((re) => re.test(uri)));
      if (uris.length === 0 && (alert.instances ?? []).length > 0) continue;
      alerts.push({
        pluginid: id,
        name: alert.alert ?? alert.name,
        risk: Number(alert.riskcode),
        confidence: Number(alert.confidence),
        description: stripTags(alert.desc ?? ""),
        solution: stripTags(alert.solution ?? ""),
        cwe: alert.cweid,
        site: site["@name"],
        level,
        uris,
      });
    }
  }
  return { alerts, failed: alerts.filter((alert) => alert.level === "FAIL") };
}

/** ZAP's description text: it wraps paragraphs in `<p>`; this is report text, never rendered as HTML. */
function stripTags(html) {
  return String(html)
    .replaceAll(/<\/?p>/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}

const ZAP_LEVEL = { FAIL: "error", WARN: "warning", INFO: "note" };
const ZAP_SEVERITY = { 3: "8.0", 2: "5.0", 1: "3.0", 0: "0.0" };

/** SARIF 2.1.0 for code scanning: a rule per ZAP plugin, a result per affected URL (a DAST finding has no source line). */
export function zapSarif(gate, target) {
  const rules = new Map();
  for (const alert of gate.alerts)
    if (!rules.has(alert.pluginid))
      rules.set(alert.pluginid, {
        id: `zap-${alert.pluginid}`,
        name: alert.name,
        shortDescription: { text: alert.name },
        fullDescription: { text: alert.description || alert.name },
        help: { text: alert.solution || alert.name },
        helpUri: `https://www.zaproxy.org/docs/alerts/${alert.pluginid}/`,
        defaultConfiguration: { level: ZAP_LEVEL[alert.level] },
        properties: {
          tags: [
            "security",
            "dast",
            ...(alert.cwe && alert.cwe !== "-1" ? [`external/cwe/cwe-${alert.cwe}`] : []),
          ],
          "security-severity": ZAP_SEVERITY[alert.risk] ?? "0.0",
        },
      });
  return {
    $schema: SARIF_SCHEMA,
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "OWASP ZAP",
            informationUri: "https://www.zaproxy.org",
            rules: [...rules.values()],
          },
        },
        automationDetails: { id: `zap/${target}/` },
        results: gate.alerts.flatMap((alert) =>
          (alert.uris.length > 0 ? alert.uris : [alert.site]).map((uri) => ({
            ruleId: `zap-${alert.pluginid}`,
            level: ZAP_LEVEL[alert.level],
            message: { text: `${alert.name} at ${uri}` },
            partialFingerprints: {
              "stackraZap/v1": createHash("sha256")
                .update(`${alert.pluginid}\n${uri}`)
                .digest("hex")
                .slice(0, 32),
            },
            // Code scanning needs a file location; the scan's own policy file stands in, the URL is in the message.
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri: POLICY_PATH },
                  region: { startLine: 1 },
                },
              },
            ],
          })),
        ),
      },
    ],
  };
}

/** The listed targets: `[{ name, url, active, note }]`. */
export function readTargets(text) {
  const targets = parse(text)?.targets;
  if (!Array.isArray(targets)) throw new UsageError(`${TARGETS_PATH}: targets must be a list`);
  for (const target of targets) {
    if (
      typeof target?.name !== "string" ||
      typeof target?.url !== "string" ||
      typeof target?.note !== "string"
    )
      throw new UsageError(`${TARGETS_PATH}: every target needs name, url and note`);
    if (new URL(target.url).protocol !== "https:")
      throw new UsageError(`${TARGETS_PATH}: ${target.name} must be https`);
  }
  return targets.map((target) => ({ ...target, active: target.active === true }));
}

/** True for loopback, the RFC 1918 and IPv6 unique-local ranges, `.internal`, `.local`, `.localhost` and Docker's host. */
export function isLocalHost(hostname) {
  const host = hostname.replaceAll(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host === "host.docker.internal" || host === "::1") return true;
  if ([".localhost", ".local", ".internal", ".home.arpa"].some((suffix) => host.endsWith(suffix)))
    return true;
  const ip = host
    .match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
    ?.slice(1)
    .map(Number);
  if (ip === undefined) return /^f[cd][0-9a-f]{2}:/.test(host);
  const [a, b] = ip;
  return a === 127 || a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

/** `{ url, name, local }` for the requested target, or a thrown UsageError when the policy refuses the scan. */
export function resolveTarget(requested, mode, targets) {
  const listed = targets.find((target) => target.name === requested || target.url === requested);
  let url;
  try {
    url = new URL(listed?.url ?? requested);
  } catch {
    throw new UsageError(
      `--target ${requested} is neither a listed target (${TARGETS_PATH}) nor a URL`,
    );
  }
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw new UsageError(`--target must be http or https`);
  if (url.username || url.password) throw new UsageError("--target must not carry credentials");
  const local = isLocalHost(url.hostname);
  const name = listed?.name ?? (local ? "local" : url.hostname);
  if (mode === "baseline" ? !local && listed === undefined : !local && listed?.active !== true)
    throw new UsageError(
      mode === "baseline"
        ? `${url.hostname} is not ours to scan: list it in ${TARGETS_PATH} (passive scans only)`
        : `an active ${mode} scan runs only against a local or private host, or a listed target with active: true; ${url.hostname} is neither`,
    );
  return { url: url.href, name, local };
}

/** The docker argv for a ZAP scan writing `zap.json` and `zap.html` into `workDir` (mounted at /zap/wrk). */
export function zapCommand({ mode, url, api, minutes, workDir, local }) {
  const script = { baseline: "zap-baseline.py", full: "zap-full-scan.py", api: "zap-api-scan.py" }[
    mode
  ];
  const target = mode === "api" ? ["-t", api, "-f", "openapi"] : ["-t", url];
  const timing = mode === "api" ? [] : ["-m", String(minutes)];
  return {
    file: dockerBinary(),
    args: [
      "run",
      "--rm",
      // A local target is the host's own port: share its network. Anything else goes out through the bridge.
      ...(local ? ["--network", "host"] : []),
      "-v",
      `${workDir}:/zap/wrk:rw`,
      ZAP_IMAGE,
      script,
      ...target,
      "-c",
      "policy.tsv",
      ...timing,
      "-J",
      "zap.json",
      "-r",
      "zap.html",
      // -I: warnings never set ZAP's exit code; the gate below decides from the JSON report.
      "-I",
    ],
    cwd: workDir,
  };
}

/** `dast`: resolve and check the target, run ZAP, gate the report. Returns the exit code. */
export function runDast(options, io = defaultIo(), root = ROOT) {
  const targets = readTargets(readFileSync(join(root, TARGETS_PATH), "utf8"));
  const policyText = readFileSync(join(root, POLICY_PATH), "utf8");
  const policy = parseZapPolicy(policyText);
  const target = resolveTarget(options.target, options.mode, targets);
  const out = options.out ? resolve(options.out) : mkdtempSync(join(tmpdir(), "stackra-zap-"));
  mkdirSync(out, { recursive: true });
  // The ZAP image runs as its own user, which must write the report into the mounted folder.
  chmodSync(out, 0o777);
  writeFileSync(join(out, "policy.tsv"), policyText);
  io.out(`zap: ${options.mode} scan of ${target.url} (${target.name}), reports in ${out}\n`);
  const result = run(
    zapCommand({ ...options, url: target.url, workDir: out, local: target.local }),
    { ...io, verbose: true },
  );
  // ZAP: 0 clean, 1 a FAIL rule, 2 warnings, 3 an error (no trustworthy report).
  if (result.status === 3 || result.status === null || !existsSync(join(out, "zap.json")))
    throw new UsageError(
      `zap exited ${result.status} without a report:\n${result.stdout.slice(-2000)}`,
    );
  const gate = gateZap(JSON.parse(readFileSync(join(out, "zap.json"), "utf8")), policy);
  if (options.sarif) writeJson(options.sarif, zapSarif(gate, target.name));
  const count = (level) => gate.alerts.filter((alert) => alert.level === level).length;
  io.out(
    `zap: ${gate.alerts.length} alert(s): ${count("FAIL")} fail, ${count("WARN")} warn, ${count("INFO")} info\n`,
  );
  for (const alert of gate.alerts.filter((a) => a.level !== "INFO"))
    io.out(
      `${alert.level} ${alert.pluginid} ${alert.name} (${alert.uris.length} URL(s)) ${alert.uris[0] ?? ""}\n`,
    );
  return gate.failed.length > 0 ? 1 : 0;
}

// ---------------------------------------------------------------------------------------------------------------- main

function writeJson(path, value) {
  mkdirSync(dirname(resolve(path)), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function defaultIo() {
  return { out: (text) => process.stdout.write(text), err: (text) => process.stderr.write(text) };
}

/** The command line's exit code. */
export function main(argv, io = defaultIo(), root = ROOT) {
  try {
    const options = parseArgs(argv);
    return options.command === "sast" ? runSast(options, io, root) : runDast(options, io, root);
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    io.err(`${error.message}\n`);
    return 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
