/**
 * Stackra file contract:
 * Purpose: hold `security-scan.mjs` to its contract: the argument rules, the SAST fingerprint and baseline gate, the
 *          ZAP policy and gate, the target refusals (never an active scan of a host we do not own), the pinned images,
 *          the SARIF shapes, and `main`'s exit codes end to end against a fake `docker` on PATH.
 * Boundary: runs no real scanner; the fake docker writes canned reports into temporary folders.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0187 decision 3; STA-2821.
 */
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  BASELINE_PATH,
  POLICY_PATH,
  ROOT,
  SEMGREP_IMAGE,
  TARGETS_PATH,
  ZAP_IMAGE,
  defaultLevel,
  fingerprintResults,
  gateSemgrep,
  gateZap,
  isLocalHost,
  main,
  parseArgs,
  parseZapPolicy,
  readBaseline,
  readTargets,
  resolveApiSpec,
  resolveTarget,
  ruleName,
  semgrepCommand,
  semgrepSarif,
  writeBaselineText,
  zapCommand,
  zapSarif,
} from "../security-scan.mjs";

const scratch = mkdtempSync(join(tmpdir(), "security-scan-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

const result = (path, line, overrides = {}) => ({
  check_id: "tools.security.semgrep.rules.stackra.sql-interpolated-string",
  path,
  start: { line, col: 3 },
  end: { line, col: 40 },
  extra: {
    message: "SQL text built from an interpolated value",
    severity: "ERROR",
    metadata: { cwe: ["CWE-89"], impact: "HIGH" },
  },
  ...overrides,
});

// ------------------------------------------------------------------------------------------------------------ arguments

test("parseArgs: a command is required and each takes only its own flags", () => {
  assert.throws(() => parseArgs([]), /usage/);
  assert.throws(() => parseArgs(["scan"]), /usage/);
  assert.throws(() => parseArgs(["sast", "--target", "x"]), /does not apply to sast/);
  assert.throws(() => parseArgs(["dast", "--target", "x", "--test"]), /does not apply to dast/);
  assert.throws(() => parseArgs(["sast", "--sarif"]), /needs a value/);
  assert.throws(() => parseArgs(["sast", "--bogus"]), /unknown argument/);
  assert.deepEqual(parseArgs(["sast", "--test", "--local"]), {
    command: "sast",
    test: true,
    local: true,
  });
});

test("parseArgs: --update-baseline needs a reason and an STA key", () => {
  assert.throws(() => parseArgs(["sast", "--update-baseline"]), /--reason/);
  assert.throws(
    () => parseArgs(["sast", "--update-baseline", "--reason", "x", "--issue", "ABC-1"]),
    /--issue STA-n/,
  );
  assert.equal(
    parseArgs(["sast", "--update-baseline", "--reason", "x", "--issue", "STA-1"]).issue,
    "STA-1",
  );
});

test("parseArgs: dast defaults to a two-minute baseline and checks mode, api and minutes", () => {
  assert.deepEqual(parseArgs(["dast", "--target", "docs"]), {
    command: "dast",
    target: "docs",
    mode: "baseline",
    minutes: 2,
  });
  assert.throws(() => parseArgs(["dast"]), /needs --target/);
  assert.throws(() => parseArgs(["dast", "--target", "x", "--mode", "attack"]), /--mode is one of/);
  assert.throws(() => parseArgs(["dast", "--target", "x", "--mode", "api"]), /needs --api/);
  assert.throws(
    () => parseArgs(["dast", "--target", "x", "--api", "http://h/o.json"]),
    /--mode api only/,
  );
  assert.throws(() => parseArgs(["dast", "--target", "x", "--minutes", "0"]), /1 to 60/);
  assert.throws(() => parseArgs(["dast", "--target", "x", "--minutes", "1.5"]), /1 to 60/);
});

// ----------------------------------------------------------------------------------------------------------------- SAST

test("ruleName: strips Semgrep's path prefix from the rule id", () => {
  assert.equal(
    ruleName("tools.security.semgrep.rules.stackra.dynamic-code"),
    "stackra.dynamic-code",
  );
  assert.equal(ruleName("other.rule"), "other.rule");
});

test("fingerprintResults: the same text keeps its fingerprint when it moves, a copy or a change does not", () => {
  const before = "a\n  db.query(`select ${x}`)\n";
  const moved = "a\nb\nc\ndb.query(`select   ${x}`)\n";
  const [one] = fingerprintResults([result("p.ts", 2)], () => before);
  const [two] = fingerprintResults([result("p.ts", 4)], () => moved);
  assert.equal(one.fingerprint, two.fingerprint);
  assert.equal(one.text, "db.query(`select ${x}`)");
  assert.equal(one.rule, "stackra.sql-interpolated-string");

  const twice = "db.query(`select ${x}`)\ndb.query(`select ${x}`)\n";
  const [first, second] = fingerprintResults([result("p.ts", 1), result("p.ts", 2)], () => twice);
  assert.notEqual(first.fingerprint, second.fingerprint);

  const [changed] = fingerprintResults([result("p.ts", 2)], () => "a\ndb.query(`select ${y}`)\n");
  assert.notEqual(changed.fingerprint, one.fingerprint);
  const [elsewhere] = fingerprintResults([result("q.ts", 2)], () => before);
  assert.notEqual(elsewhere.fingerprint, one.fingerprint);
});

test("gateSemgrep: a finding in the baseline is known, any other is new, a vanished entry is stale", () => {
  const findings = [{ fingerprint: "a" }, { fingerprint: "b" }];
  const gate = gateSemgrep(findings, [{ fingerprint: "a" }, { fingerprint: "z" }]);
  assert.deepEqual(gate.known, [{ fingerprint: "a" }]);
  assert.deepEqual(gate.fresh, [{ fingerprint: "b" }]);
  assert.deepEqual(gate.stale, [{ fingerprint: "z" }]);
});

test("readBaseline: every entry carries rule, path, fingerprint, reason and an STA key", () => {
  assert.deepEqual(readBaseline(undefined), []);
  assert.deepEqual(readBaseline("findings: []\n"), []);
  const ok = "findings:\n  - {rule: r, path: p, fingerprint: f, reason: why, issue: STA-9}\n";
  assert.equal(readBaseline(ok)[0].issue, "STA-9");
  assert.throws(
    () => readBaseline("findings:\n  - {rule: r, path: p, fingerprint: f, issue: STA-9}\n"),
    /needs reason/,
  );
  assert.throws(
    () => readBaseline("findings:\n  - {rule: r, path: p, fingerprint: f, reason: x, issue: X}\n"),
    /STA key/,
  );
  assert.throws(() => readBaseline("findings: nope\n"), /must be a list/);
});

test("writeBaselineText: keeps an accepted entry's reason, gives new ones the run's, and reads back", () => {
  const findings = [
    { rule: "stackra.b", path: "b.ts", fingerprint: "2" },
    { rule: "stackra.a", path: "a.ts", fingerprint: "1" },
  ];
  const text = writeBaselineText(
    findings,
    [{ fingerprint: "1", reason: "old", issue: "STA-1" }],
    "new",
    "STA-2",
  );
  assert.match(text, /^# Stackra file contract:/);
  const entries = readBaseline(text);
  assert.deepEqual(
    entries.map((e) => [e.path, e.reason, e.issue]),
    [
      ["a.ts", "old", "STA-1"],
      ["b.ts", "new", "STA-2"],
    ],
  );
});

test("the committed baseline file parses and every entry names a Stackra rule", () => {
  const entries = readBaseline(readFileSync(join(ROOT, BASELINE_PATH), "utf8"));
  for (const entry of entries) assert.match(entry.rule, /^stackra\.[a-z-]+$/);
});

test("semgrepCommand: the pinned image, the checkout read-only, no network; --local runs semgrep on PATH", () => {
  assert.match(SEMGREP_IMAGE, /^semgrep\/semgrep:[\d.]+-nonroot@sha256:[0-9a-f]{64}$/);
  const scan = semgrepCommand({ test: false, local: false, root: "/repo" });
  assert.equal(scan.file, "docker");
  assert.deepEqual(scan.args.slice(0, 8), [
    "run",
    "--rm",
    "--network",
    "none",
    "-v",
    "/repo:/src:ro",
    "-w",
    "/src",
  ]);
  assert.ok(scan.args.includes(SEMGREP_IMAGE));
  assert.ok(scan.args.includes("--metrics=off"));
  for (const path of ["apps", "packages", "services", "workers"])
    assert.ok(scan.args.includes(path));
  assert.ok(scan.args.join(" ").includes("--exclude __tests__"));
  const fixtures = semgrepCommand({ test: true, local: true, root: "/repo" });
  assert.equal(fixtures.file, "semgrep");
  assert.deepEqual(fixtures.args.slice(0, 1), ["--test"]);
});

test("semgrepSarif: one rule per Stackra rule, baselineState new or unchanged, a stable fingerprint", () => {
  const [a, b] = fingerprintResults([result("p.ts", 1), result("p.ts", 2)], () => "x\ny\n");
  const sarif = semgrepSarif({ known: [a], fresh: [b], stale: [] }, "1.184.0");
  assert.equal(sarif.version, "2.1.0");
  const [run] = sarif.runs;
  assert.equal(run.tool.driver.rules.length, 1);
  assert.equal(run.tool.driver.rules[0].properties["security-severity"], "7.5");
  assert.deepEqual(
    run.results.map((r) => [
      r.baselineState,
      r.level,
      r.locations[0].physicalLocation.region.startLine,
    ]),
    [
      ["unchanged", "error", 1],
      ["new", "error", 2],
    ],
  );
  assert.equal(run.results[0].partialFingerprints["stackraFingerprint/v1"], a.fingerprint);
});

// ----------------------------------------------------------------------------------------------------------------- DAST

const POLICY = [
  "# a comment",
  "",
  "40018\tFAIL\tSQL Injection",
  "10021\tWARN\tX-Content-Type-Options",
  "10027\tIGNORE\tcomments",
  "10035\tINFO\tHSTS",
  "10038\tOUTOFSCOPE\t.*/assets/.*",
].join("\n");

const zapReport = {
  site: [
    {
      "@name": "https://docs.example",
      alerts: [
        {
          pluginid: "40018",
          alert: "SQL Injection",
          riskcode: "3",
          confidence: "2",
          cweid: "89",
          desc: "<p>bad</p>",
          instances: [{ uri: "https://docs.example/q?id=1" }],
        },
        {
          pluginid: "10021",
          alert: "XCTO",
          riskcode: "1",
          confidence: "2",
          instances: [{ uri: "https://docs.example/" }],
        },
        {
          pluginid: "10027",
          alert: "Comments",
          riskcode: "0",
          instances: [{ uri: "https://docs.example/" }],
        },
        {
          pluginid: "10035",
          alert: "HSTS",
          riskcode: "1",
          instances: [{ uri: "https://docs.example/" }],
        },
        {
          pluginid: "10038",
          alert: "CSP",
          riskcode: "2",
          instances: [{ uri: "https://docs.example/assets/a.js" }],
        },
        {
          pluginid: "99999",
          alert: "Unlisted high",
          riskcode: "3",
          instances: [{ uri: "https://docs.example/x" }],
        },
        // ZAP removed every instance its own OUTOFSCOPE matched: nothing is left to report
        { pluginid: "10099", alert: "Source Code Disclosure - SQL", riskcode: "2", instances: [] },
        {
          pluginid: "99998",
          alert: "Unlisted medium",
          riskcode: "2",
          instances: [{ uri: "https://docs.example/y" }],
        },
      ],
    },
  ],
};

test("parseZapPolicy: levels per plugin, out-of-scope regexes, comments skipped, bad lines refused", () => {
  const policy = parseZapPolicy(POLICY);
  assert.equal(policy.levels.get("40018"), "FAIL");
  assert.equal(policy.levels.get("10027"), "IGNORE");
  assert.ok(policy.outOfScope.get("10038")[0].test("https://h/assets/x.js"));
  // anchored at the start, as ZAP matches: a pattern for one host never drops another host's URL
  const anchored = parseZapPolicy("10038\tOUTOFSCOPE\thttps://a\\.example/.*").outOfScope.get(
    "10038",
  )[0];
  assert.ok(anchored.test("https://a.example/x"));
  assert.ok(!anchored.test("https://b.example/?next=https://a.example/x"));
  assert.throws(() => parseZapPolicy("40018 FAIL spaces"), /three tab-separated/);
  assert.throws(() => parseZapPolicy("40018\tBLOCK\tx"), /unknown level/);
  assert.throws(() => parseZapPolicy("4001,8\tFAIL\tx"), /numeric plugin id/);
});

test("defaultLevel: an unlisted High fails, a Medium warns, the rest inform", () => {
  assert.deepEqual([3, 2, 1, 0].map(defaultLevel), ["FAIL", "WARN", "INFO", "INFO"]);
});

test("gateZap: the policy decides, IGNORE and out-of-scope URLs drop, an unlisted High fails", () => {
  const gate = gateZap(zapReport, parseZapPolicy(POLICY));
  assert.deepEqual(
    gate.alerts.map((a) => [a.pluginid, a.level]),
    [
      ["40018", "FAIL"],
      ["10021", "WARN"],
      ["10035", "INFO"],
      ["99999", "FAIL"],
      ["99998", "WARN"],
    ],
  );
  assert.deepEqual(
    gate.failed.map((a) => a.pluginid),
    ["40018", "99999"],
  );
  assert.equal(gate.alerts[0].description, "bad");
});

test("the committed ZAP policy parses and fails the injection classes", () => {
  const policy = parseZapPolicy(readFileSync(join(ROOT, POLICY_PATH), "utf8"));
  for (const id of ["40012", "40014", "40018", "40046", "90020", "90023"])
    assert.equal(policy.levels.get(id), "FAIL");
});

test("zapSarif: a rule per plugin with a severity, a result per URL", () => {
  const sarif = zapSarif(gateZap(zapReport, parseZapPolicy(POLICY)), "docs");
  const [run] = sarif.runs;
  assert.equal(run.automationDetails.id, "zap/docs/");
  const sql = run.tool.driver.rules.find((rule) => rule.id === "zap-40018");
  assert.equal(sql.properties["security-severity"], "8.0");
  assert.ok(sql.properties.tags.includes("external/cwe/cwe-89"));
  const results = run.results.filter((r) => r.ruleId === "zap-40018");
  assert.equal(results.length, 1);
  assert.equal(results[0].level, "error");
  assert.match(results[0].message.text, /docs\.example\/q\?id=1/);
});

test("isLocalHost: loopback, private ranges and internal names only", () => {
  for (const host of [
    "localhost",
    "127.0.0.1",
    "10.1.2.3",
    "172.20.0.5",
    "192.168.1.9",
    "api.internal",
    "box.local",
    "[::1]",
    "fd12:3456::1",
    "host.docker.internal",
  ])
    assert.equal(isLocalHost(host), true, host);
  for (const host of [
    "docs.stackra.figentra.com",
    "8.8.8.8",
    "172.32.0.1",
    "169.254.169.254",
    "example.com",
  ])
    assert.equal(isLocalHost(host), false, host);
});

const TARGETS = readTargets(`targets:
  - { name: docs, url: "https://docs.example/", note: ours }
  - { name: lab, url: "https://lab.example/", note: ours, active: true }
`);

test("resolveTarget: passive scans reach listed or local hosts; active scans only local or active-listed ones", () => {
  assert.deepEqual(resolveTarget("docs", "baseline", TARGETS), {
    url: "https://docs.example/",
    name: "docs",
    local: false,
  });
  assert.deepEqual(resolveTarget("http://127.0.0.1:4000/", "full", TARGETS), {
    url: "http://127.0.0.1:4000/",
    name: "local",
    local: true,
  });
  assert.equal(resolveTarget("lab", "full", TARGETS).name, "lab");
  assert.throws(
    () => resolveTarget("https://example.com/", "baseline", TARGETS),
    /not ours to scan/,
  );
  assert.throws(
    () => resolveTarget("docs", "full", TARGETS),
    /active full scan runs only against a local/,
  );
  assert.throws(
    () => resolveTarget("https://u:p@docs.example/", "baseline", TARGETS),
    /credentials/,
  );
  assert.throws(() => resolveTarget("ftp://10.0.0.1/", "baseline", TARGETS), /http or https/);
  assert.throws(() => resolveTarget("nonsense", "baseline", TARGETS), /neither a listed target/);
});

test("resolveApiSpec: the spec comes from the target's origin or a local host, never a host we do not own", () => {
  const local = resolveTarget("http://127.0.0.1:4000/", "api", TARGETS);
  assert.equal(
    resolveApiSpec("http://127.0.0.1:4000/openapi.json", local),
    "http://127.0.0.1:4000/openapi.json",
  );
  assert.equal(
    resolveApiSpec("http://localhost:8080/spec.json", local),
    "http://localhost:8080/spec.json",
  );
  const lab = resolveTarget("lab", "api", TARGETS);
  assert.equal(
    resolveApiSpec("https://lab.example/openapi.json", lab),
    "https://lab.example/openapi.json",
  );
  // The review's case: a local target with the production registry's spec would attack the registry.
  assert.throws(
    () => resolveApiSpec("https://npm.stackra.figentra.com/openapi.json", local),
    /--api must be on the target's origin \(http:\/\/127\.0\.0\.1:4000\) or a local host/,
  );
  assert.throws(() => resolveApiSpec("https://docs.example/openapi.json", lab), /target's origin/);
  assert.throws(() => resolveApiSpec("http://u:p@127.0.0.1:4000/o.json", local), /credentials/);
  assert.throws(() => resolveApiSpec("file:///etc/passwd", local), /http or https/);
  assert.throws(() => resolveApiSpec("openapi.json", local), /not a URL/);
});

test("readTargets: the committed file lists https targets, none active", () => {
  const targets = readTargets(readFileSync(join(ROOT, TARGETS_PATH), "utf8"));
  assert.ok(targets.length > 0);
  for (const target of targets)
    assert.equal(target.active, false, `${target.name} is production: passive only`);
  assert.throws(
    () => readTargets("targets:\n  - { name: a, url: 'http://a.example/', note: n }\n"),
    /must be https/,
  );
  assert.throws(
    () => readTargets("targets:\n  - { name: a, url: 'https://a.example/' }\n"),
    /needs name, url and note/,
  );
});

test("zapCommand: the pinned image, host network only for a local target, the report gated from JSON", () => {
  assert.match(ZAP_IMAGE, /^zaproxy\/zap-stable:[\d.]+@sha256:[0-9a-f]{64}$/);
  const remote = zapCommand({
    mode: "baseline",
    url: "https://docs.example/",
    minutes: 2,
    workDir: "/w",
    local: false,
  });
  assert.ok(!remote.args.includes("host"));
  assert.ok(remote.args.includes(ZAP_IMAGE));
  assert.deepEqual(remote.args.slice(remote.args.indexOf(ZAP_IMAGE) + 1), [
    "zap-baseline.py",
    "-t",
    "https://docs.example/",
    "-c",
    "policy.tsv",
    "-m",
    "2",
    "-J",
    "zap.json",
    "-r",
    "zap.html",
    "-I",
  ]);
  const local = zapCommand({
    mode: "full",
    url: "http://127.0.0.1:4000/",
    minutes: 5,
    workDir: "/w",
    local: true,
  });
  assert.deepEqual(local.args.slice(2, 4), ["--network", "host"]);
  assert.ok(local.args.includes("zap-full-scan.py"));
  const api = zapCommand({
    mode: "api",
    api: "http://127.0.0.1:4000/openapi.json",
    url: "http://127.0.0.1:4000/",
    minutes: 2,
    workDir: "/w",
    local: true,
  });
  assert.ok(api.args.includes("zap-api-scan.py"));
  assert.ok(api.args.includes("openapi"));
  assert.ok(!api.args.includes("-m"));
  // -O pins the attack to the target's origin, whatever host the spec's `servers` name.
  const apiRemoteSpec = zapCommand({
    mode: "api",
    api: "http://localhost:8080/spec.json",
    url: "http://127.0.0.1:4000/",
    workDir: "/w",
    local: true,
  });
  assert.deepEqual(
    apiRemoteSpec.args.slice(apiRemoteSpec.args.indexOf("zap-api-scan.py") + 1, -7),
    ["-t", "http://localhost:8080/spec.json", "-f", "openapi", "-O", "http://127.0.0.1:4000"],
  );
});

// ------------------------------------------------------------------------------------------------- main, with fake docker

/** A checkout with the rules, policy and targets, one source file, and a fake docker that replays canned output. */
function fakeRepo(name, { semgrepJson, zapJson, zapStatus = 0 }) {
  const root = join(scratch, name);
  for (const dir of ["tools/security/semgrep/rules", "tools/security/zap", "packages/a/src", "bin"])
    mkdirSync(join(root, dir), { recursive: true });
  writeFileSync(join(root, POLICY_PATH), POLICY);
  writeFileSync(
    join(root, TARGETS_PATH),
    "targets:\n  - { name: docs, url: 'https://docs.example/', note: ours }\n",
  );
  writeFileSync(
    join(root, "packages/a/src/q.ts"),
    "export const q = () => db.query(`select ${id}`);\n",
  );
  writeFileSync(
    join(root, "semgrep.json"),
    JSON.stringify(semgrepJson ?? { results: [], errors: [], paths: { scanned: [] } }),
  );
  writeFileSync(join(root, "zap.json"), JSON.stringify(zapJson ?? { site: [] }));
  const docker = join(root, "bin", "docker");
  // The fake records its argv, prints the Semgrep report, or writes the ZAP report into the mounted work folder.
  writeFileSync(
    docker,
    `#!/bin/sh
printf '%s\\n' "$*" >> "${root}/docker.log"
case "$*" in
  *zap-*) dir=$(printf '%s' "$*" | sed -n 's/.*-v \\([^ ]*\\):\\/zap\\/wrk.*/\\1/p'); cp "${root}/zap.json" "$dir/zap.json"; exit ${zapStatus} ;;
  *--test*) echo "7/7: all tests passed"; exit 0 ;;
  *) cat "${root}/semgrep.json" ;;
esac
`,
  );
  chmodSync(docker, 0o755);
  return root;
}

function capture() {
  const io = { text: "", out: (t) => (io.text += t), err: (t) => (io.text += t) };
  return io;
}

function withDocker(root, fn) {
  const previous = process.env.STACKRA_DOCKER;
  process.env.STACKRA_DOCKER = join(root, "bin", "docker");
  try {
    return fn();
  } finally {
    if (previous === undefined) delete process.env.STACKRA_DOCKER;
    else process.env.STACKRA_DOCKER = previous;
  }
}

const report = {
  version: "1.184.0",
  errors: [],
  paths: { scanned: ["packages/a/src/q.ts"] },
  results: [result("packages/a/src/q.ts", 1)],
};

test("main sast: a new finding exits 1, the baseline update accepts it, the next run exits 0 and writes SARIF", () => {
  const root = fakeRepo("sast", { semgrepJson: report });
  withDocker(root, () => {
    const first = capture();
    assert.equal(main(["sast"], first, root), 1);
    assert.match(first.text, /1 finding\(s\): 0 known, 1 new/);
    assert.match(first.text, /NEW stackra\.sql-interpolated-string packages\/a\/src\/q\.ts:1/);

    assert.equal(
      main(
        ["sast", "--update-baseline", "--reason", "landed with the rule", "--issue", "STA-2821"],
        capture(),
        root,
      ),
      0,
    );
    assert.equal(readBaseline(readFileSync(join(root, BASELINE_PATH), "utf8")).length, 1);

    const sarif = join(root, "out", "semgrep.sarif");
    const second = capture();
    assert.equal(main(["sast", "--sarif", sarif], second, root), 0);
    assert.match(second.text, /1 known, 0 new/);
    assert.equal(
      JSON.parse(readFileSync(sarif, "utf8")).runs[0].results[0].baselineState,
      "unchanged",
    );
  });
});

test("main sast: a fixed finding is reported stale; --test runs the rule fixtures", () => {
  const root = fakeRepo("stale", { semgrepJson: report });
  withDocker(root, () => {
    main(["sast", "--update-baseline", "--reason", "r", "--issue", "STA-1"], capture(), root);
    writeFileSync(join(root, "semgrep.json"), JSON.stringify({ ...report, results: [] }));
    const io = capture();
    assert.equal(main(["sast"], io, root), 0);
    assert.match(io.text, /1 baseline entry is fixed/);
    const tests = capture();
    assert.equal(main(["sast", "--test"], tests, root), 0);
    assert.match(
      readFileSync(join(root, "docker.log"), "utf8"),
      /semgrep --test --config tools\/security\/semgrep\/rules/,
    );
  });
});

test("main sast: a Semgrep rule error or a missing report is a tool failure (exit 2)", () => {
  const broken = fakeRepo("rule-error", {
    semgrepJson: { ...report, errors: [{ type: "Rule parse error" }] },
  });
  withDocker(broken, () => assert.equal(main(["sast"], capture(), broken), 2));
  const empty = fakeRepo("no-report", {});
  writeFileSync(join(empty, "semgrep.json"), "not json");
  withDocker(empty, () => assert.equal(main(["sast"], capture(), empty), 2));
});

test("main dast: a FAIL alert exits 1 with SARIF; a clean report exits 0; a refused target never starts docker", () => {
  const failing = fakeRepo("dast-fail", { zapJson: zapReport, zapStatus: 1 });
  withDocker(failing, () => {
    const io = capture();
    const sarif = join(failing, "zap.sarif");
    assert.equal(
      main(
        ["dast", "--target", "docs", "--out", join(failing, "zap-out"), "--sarif", sarif],
        io,
        failing,
      ),
      1,
    );
    assert.match(io.text, /2 fail/);
    assert.match(io.text, /FAIL 40018 SQL Injection/);
    assert.equal(JSON.parse(readFileSync(sarif, "utf8")).runs[0].automationDetails.id, "zap/docs/");
    assert.match(readFileSync(join(failing, "zap-out", "policy.tsv"), "utf8"), /40018\tFAIL/);
  });

  const clean = fakeRepo("dast-clean", { zapJson: { site: [] } });
  withDocker(clean, () =>
    assert.equal(
      main(["dast", "--target", "http://127.0.0.1:4000/", "--mode", "full"], capture(), clean),
      0,
    ),
  );
  assert.match(
    readFileSync(join(clean, "docker.log"), "utf8"),
    /--network host .*zap-full-scan\.py -t http:\/\/127\.0\.0\.1:4000\//,
  );

  const refused = fakeRepo("dast-refused", {});
  withDocker(refused, () => {
    const io = capture();
    assert.equal(main(["dast", "--target", "docs", "--mode", "full"], io, refused), 2);
    assert.match(io.text, /active full scan runs only against a local/);
  });
  assert.throws(() => readFileSync(join(refused, "docker.log")), /ENOENT/);
});

test("main dast api: a spec we do not own is refused before docker starts; a local one scans only the target", () => {
  const refused = fakeRepo("dast-api-refused", {});
  withDocker(refused, () => {
    const io = capture();
    const argv = ["dast", "--target", "http://127.0.0.1:4000/", "--mode", "api"];
    assert.equal(
      main([...argv, "--api", "https://npm.stackra.figentra.com/openapi.json"], io, refused),
      2,
    );
    assert.match(io.text, /--api must be on the target's origin/);
  });
  assert.throws(() => readFileSync(join(refused, "docker.log")), /ENOENT/);

  const clean = fakeRepo("dast-api-clean", { zapJson: { site: [] } });
  withDocker(clean, () =>
    assert.equal(
      main(
        [
          "dast",
          "--target",
          "http://127.0.0.1:4000/",
          "--mode",
          "api",
          "--api",
          "http://127.0.0.1:4000/openapi.json",
        ],
        capture(),
        clean,
      ),
      0,
    ),
  );
  assert.match(
    readFileSync(join(clean, "docker.log"), "utf8"),
    /--network host .*zap-api-scan\.py -t http:\/\/127\.0\.0\.1:4000\/openapi\.json -f openapi -O http:\/\/127\.0\.0\.1:4000 /,
  );
});

test("main dast: ZAP's error exit (3) is a tool failure, not a pass", () => {
  const root = fakeRepo("dast-error", { zapJson: { site: [] }, zapStatus: 3 });
  withDocker(root, () => assert.equal(main(["dast", "--target", "docs"], capture(), root), 2));
});
