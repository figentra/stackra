#!/usr/bin/env node
/**
 * spec-linear — link a spec-kit spec and its tasks to Linear (team STA).
 *
 *   node tools/scripts/spec-linear.mjs issue <spec.md>  [--dry-run]   create the spec's issue, write `**Linear**: STA-n`
 *   node tools/scripts/spec-linear.mjs tasks <tasks.md> [--dry-run]   one sub-issue per `T###` task, appends ` [STA-n]`
 *
 * The token comes from the environment only, through the shared client in linear.mjs
 * (LINEAR_AGENT_TOKEN, else LINEAR_API_KEY; `infisical run --env=dev --path=/agents -- node ...`).
 * It is never read from a file or printed. `--dry-run` needs no token
 * and calls nothing. When an agent runs this flow it uses the Linear MCP instead and edits the
 * same fields by hand. `**Linear project**` (optional) names the project to file issues under.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { client } from "./linear.mjs";

const TEAM = "STA";

/** The spec's `**Linear**` key and optional project name. */
export function specLinks(text) {
  return {
    key: text.match(/^\*\*Linear\*\*:\s*(STA-\d+)\b/m)?.[1],
    project: text.match(/^\*\*Linear project\*\*:\s*(.+?)\s*$/m)?.[1],
    title: text.match(/^# Feature Specification:\s*(.+?)\s*$/m)?.[1] ?? "Untitled spec",
  };
}

/** Task lines (`- [ ] T001 ...`) that have no ` [STA-n]` yet. */
export function unlinkedTasks(text) {
  return text
    .split("\n")
    .map((line, i) => ({ line, i, m: line.match(/^- \[[ xX]\] (T\d+)\s+(.*)$/) }))
    .filter(({ m, line }) => m && !/\[STA-\d+\]\s*$/.test(line))
    .map(({ m, i }) => ({ index: i, id: m[1], title: m[2].trim() }));
}

const gql = (query, variables) => client().gql(query, variables);

async function context(project) {
  const t = await gql(`query($k:String!){teams(filter:{key:{eq:$k}}){nodes{id}}}`, { k: TEAM });
  const teamId = t.teams.nodes[0]?.id;
  if (!teamId) throw new Error(`Linear team ${TEAM} not found`);
  let projectId;
  if (project && project.toLowerCase() !== "none") {
    const p = await gql(`query($n:String!){projects(filter:{name:{eq:$n}}){nodes{id}}}`, {
      n: project,
    });
    projectId = p.projects.nodes[0]?.id;
    if (!projectId) throw new Error(`Linear project "${project}" not found`);
  }
  return { teamId, projectId };
}

async function createIssue(ctx, title, description, parentId) {
  const d = await gql(
    `mutation($i:IssueCreateInput!){issueCreate(input:$i){issue{id identifier}}}`,
    { i: { teamId: ctx.teamId, projectId: ctx.projectId, title, description, parentId } },
  );
  return d.issueCreate.issue;
}

async function main([mode, file, ...flags]) {
  const dry = flags.includes("--dry-run");
  if (!["issue", "tasks"].includes(mode) || !file) {
    console.error("usage: spec-linear.mjs issue <spec.md> | tasks <tasks.md> [--dry-run]");
    return 2;
  }
  const specPath = mode === "issue" ? file : join(dirname(file), "spec.md");
  const links = specLinks(readFileSync(specPath, "utf8"));

  if (mode === "issue") {
    if (links.key) return (console.log(`${specPath} already linked to ${links.key}`), 0);
    if (dry) return (console.log(`[dry-run] would create ${TEAM} issue "${links.title}"`), 0);
    const issue = await createIssue(await context(links.project), links.title, `Spec: ${specPath}`);
    const text = readFileSync(specPath, "utf8").replace(
      /^\*\*Linear\*\*:.*$/m,
      `**Linear**: ${issue.identifier}`,
    );
    writeFileSync(specPath, text);
    console.log(`linked ${specPath} to ${issue.identifier}`);
    return 0;
  }

  if (!links.key) {
    console.error("spec has no **Linear** key; run `issue` first");
    return 1;
  }
  const lines = readFileSync(file, "utf8").split("\n");
  const todo = unlinkedTasks(lines.join("\n"));
  if (dry) {
    for (const t of todo)
      console.log(`[dry-run] would create sub-issue of ${links.key}: ${t.id} ${t.title}`);
    return 0;
  }
  const ctx = await context(links.project);
  const parent = (await gql(`query($i:String!){issue(id:$i){id}}`, { i: links.key })).issue.id;
  for (const t of todo) {
    const issue = await createIssue(ctx, `${t.id} ${t.title}`, `Spec ${links.key}`, parent);
    lines[t.index] += ` [${issue.identifier}]`;
    writeFileSync(file, lines.join("\n"));
    console.log(`${t.id} -> ${issue.identifier}`);
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => (console.error(`spec-linear: ${e.message}`), process.exit(1)),
  );
