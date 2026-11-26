/**
 * Stackra file contract:
 * Purpose: hold the community health files to what an outside contributor needs (STA-314): the code of conduct, the
 *          support guide and the issue forms exist where GitHub reads them, the forms parse with the fields GitHub
 *          requires, every relative link in the contributor-facing pages resolves (anchors included), SECURITY.md
 *          states which versions get fixes, CONTRIBUTING.md gives the same install command the Quality Gate runs, and
 *          its pull request and maintainer steps match what the Linear key check (prCarriesKey) and the CI triggers do.
 * Boundary: reads repository files as text and YAML and calls the pure prCarriesKey; nothing reaches GitHub or Linear.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0187 (security programme: the reporting policy);
 *                     STA-314.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { parse } from "yaml";
import { prCarriesKey } from "../linear.mjs";

/** The pages an outside contributor reads, by repository path. */
const PAGES = [
  "CONTRIBUTING.md",
  "SECURITY.md",
  ".github/CODE_OF_CONDUCT.md",
  ".github/SUPPORT.md",
];

/** The folder GitHub reads issue forms and the chooser config from. */
const FORMS = ".github/ISSUE_TEMPLATE";

/** The body element types GitHub's issue form schema accepts. */
const FORM_TYPES = new Set(["markdown", "textarea", "input", "dropdown", "checkboxes"]);

/** The labels the repository has, which a form may apply (`gh label list -R stackra-inc/stackra`). */
const KNOWN_LABELS = new Set(["bug", "documentation", "enhancement", "question"]);

/**
 * GitHub's anchor for a heading: lower case, punctuation other than `-` and `_` dropped, spaces to hyphens.
 * @param {string} heading the heading text without its `#` marks
 * @returns {string} the anchor
 */
function slug(heading) {
  return heading
    .toLowerCase()
    .replaceAll(/[`*]/g, "")
    .replaceAll(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replaceAll(/\s/g, "-");
}

/**
 * The anchors of a Markdown file's headings, outside code fences.
 * @param {string} text the file's contents
 * @returns {Set<string>} the anchors
 */
function anchors(text) {
  const found = new Set();
  let fenced = false;
  for (const line of text.split("\n")) {
    if (line.trimStart().startsWith("```")) fenced = !fenced;
    const heading = !fenced && /^#{1,6}\s+(.+)$/.exec(line);
    if (heading) found.add(slug(heading[1]));
  }
  return found;
}

/**
 * The link targets of a Markdown file's `[text](target)` links, outside code fences.
 * @param {string} text the file's contents
 * @returns {string[]} the targets
 */
function links(text) {
  const prose = text.replaceAll(/```[\s\S]*?```/g, "");
  return [...prose.matchAll(/\]\(([^)\s]+)\)/g)].map((match) => match[1]);
}

test("the code of conduct and the support guide are where GitHub reads them", () => {
  for (const path of [".github/CODE_OF_CONDUCT.md", ".github/SUPPORT.md"]) {
    assert.ok(existsSync(path), `${path} is missing`);
    assert.match(readFileSync(path, "utf8"), /^# \S/, `${path} has no title`);
  }
  assert.match(
    readFileSync(".github/CODE_OF_CONDUCT.md", "utf8"),
    /## Reporting[\s\S]*@/,
    "the code of conduct names no private address to report to",
  );
});

test("every relative link in the contributor pages resolves, anchors included", () => {
  for (const page of PAGES) {
    const text = readFileSync(page, "utf8");
    for (const target of links(text)) {
      if (/^[a-z]+:/i.test(target)) continue;
      const [file, anchor] = target.split("#");
      const path = file === "" ? page : normalize(join(dirname(page), file));
      assert.ok(existsSync(path), `${page} links to ${target}, but ${path} does not exist`);
      if (anchor && path.endsWith(".md")) {
        assert.ok(
          anchors(readFileSync(path, "utf8")).has(anchor),
          `${page} links to ${target}, but ${path} has no heading #${anchor}`,
        );
      }
    }
  }
});

test("the issue chooser allows no blank issue and routes security reports to private reporting", () => {
  const config = parse(readFileSync(join(FORMS, "config.yml"), "utf8"));
  assert.equal(config.blank_issues_enabled, false);
  assert.ok(
    config.contact_links.some((link) => link.url.endsWith("/security/advisories/new")),
    "no contact link to private vulnerability reporting",
  );
  for (const link of config.contact_links) {
    assert.ok(
      link.name && link.url && link.about,
      `contact link ${JSON.stringify(link)} lacks name, url or about`,
    );
  }
});

test("every issue form parses with the fields GitHub requires and applies a known label", () => {
  const forms = readdirSync(FORMS).filter((name) => name.endsWith(".yml") && name !== "config.yml");
  assert.ok(forms.length >= 3, `only ${forms.length} issue forms`);
  for (const name of forms) {
    const form = parse(readFileSync(join(FORMS, name), "utf8"));
    assert.ok(form.name && form.description, `${name} lacks name or description`);
    assert.ok(Array.isArray(form.body) && form.body.length > 0, `${name} has no body`);
    const ids = new Set();
    for (const element of form.body) {
      assert.ok(FORM_TYPES.has(element.type), `${name}: unknown element type ${element.type}`);
      if (element.type === "markdown") continue;
      assert.ok(
        element.id && !ids.has(element.id),
        `${name}: missing or repeated id ${element.id}`,
      );
      ids.add(element.id);
      assert.ok(element.attributes?.label, `${name}: ${element.id} has no label`);
      if (element.type === "dropdown")
        assert.ok(element.attributes.options?.length > 0, `${name}: ${element.id}`);
    }
    assert.ok(
      form.body.some((element) => element.validations?.required),
      `${name} requires nothing`,
    );
    for (const label of form.labels ?? []) {
      assert.ok(
        KNOWN_LABELS.has(label),
        `${name} applies ${label}, which the repository does not have`,
      );
    }
  }
});

test("each issue form the support guide links to exists", () => {
  const support = readFileSync(".github/SUPPORT.md", "utf8");
  const linked = [...support.matchAll(/[?&]template=([\w.-]+)/g)].map((match) => match[1]);
  assert.ok(linked.length > 0, "SUPPORT.md links to no issue form");
  for (const name of linked)
    assert.ok(existsSync(join(FORMS, name)), `SUPPORT.md links to ${name}, which is missing`);
});

test("SECURITY.md says which versions get security fixes", () => {
  const security = readFileSync("SECURITY.md", "utf8");
  assert.match(security, /^## Supported versions$/m);
  assert.match(security.slice(security.indexOf("## Supported versions")), /latest release/);
});

test("CONTRIBUTING.md installs with the same filters as the Quality Gate", () => {
  const ci = readFileSync(".github/workflows/ci.yml", "utf8");
  const install = /- name: Install dependencies\n\s+run: (pnpm install[^\n]*)/.exec(ci);
  assert.ok(install, "ci.yml has no Install dependencies step");
  const filters = install[1].match(/--filter='[^']+'/g) ?? [];
  const contributing = readFileSync("CONTRIBUTING.md", "utf8");
  const documented = contributing.split("\n").find((line) => line.startsWith("pnpm install"));
  assert.ok(documented, "CONTRIBUTING.md gives no pnpm install command");
  assert.deepEqual(documented.match(/--filter='[^']+'/g) ?? [], filters);
});

/**
 * One `## <title>` section of a Markdown file, up to the next heading of the same level.
 * @param {string} text the file's contents
 * @param {string} title the section's heading text
 * @returns {string} the section, or "" when there is none
 */
function section(text, title) {
  const start = text.indexOf(`\n## ${title}\n`);
  if (start === -1) return "";
  const end = text.indexOf("\n## ", start + 1);
  return text.slice(start, end === -1 ? undefined : end);
}

test("CONTRIBUTING.md describes the Linear key check the way check-pr runs it", () => {
  const guide = section(readFileSync("CONTRIBUTING.md", "utf8"), "Pull requests");
  assert.ok(guide, "CONTRIBUTING.md has no Pull requests section");
  // A fork branch with the key only in the title fails: the guide must not offer the title as the way in.
  assert.equal(
    prCarriesKey({ title: "fix(cli): explain the missing token (STA-123)", branch: "patch-1" }).ok,
    false,
  );
  assert.doesNotMatch(
    guide,
    /or put\s+the key in the title/,
    "CONTRIBUTING.md offers the title as an alternative to the branch name, which check-pr rejects",
  );
  assert.match(
    guide,
    /title alone is not enough/,
    "CONTRIBUTING.md does not say the title alone fails",
  );
  // The branch it names passes, and so does the chore-lane label it offers instead.
  const branch = /`(figentra\/sta-123-[a-z0-9-]+)`/.exec(guide);
  assert.ok(branch, "CONTRIBUTING.md gives no example figentra/sta-<n>-<slug> branch");
  assert.equal(
    prCarriesKey({ title: "fix(cli): explain the missing token", branch: branch[1] }).ok,
    true,
  );
  assert.match(guide, /`figentra\/sta-<n>-<short-slug>`/);
  assert.match(guide, /`chore-lane`/);
  assert.equal(prCarriesKey({ branch: "patch-1", labels: ["chore-lane"] }).ok, true);
});

test("CONTRIBUTING.md tells maintainers a way to rerun the gate that sees a new label", () => {
  const ci = parse(readFileSync(".github/workflows/ci.yml", "utf8"));
  const types = ci.on.pull_request.types ?? [];
  const maintainers = section(readFileSync("CONTRIBUTING.md", "utf8"), "For maintainers");
  // A re-run reuses its original event payload, whose labels predate the new one; only a new event reads it.
  assert.doesNotMatch(
    maintainers,
    /so re-run the `Quality Gate` job/,
    "a re-run reuses the original event, so it never sees the chore-lane label",
  );
  if (types.includes("labeled")) return;
  assert.ok(types.includes("reopened"), "ci.yml no longer runs on reopened");
  assert.match(maintainers, /Close and reopen the pull request after labelling it/);
});
