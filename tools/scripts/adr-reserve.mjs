#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm adr:reserve <slug> --issue STA-n [--owner <who>]` (STA-1732): reads `numbers.yaml` from GitHub's main,
 *          takes the highest number plus one, commits the entry to a new branch `adr/<NNNN>-<slug>` through the GitHub
 *          API and opens a one-line PR. The first PR to land wins; a loser's PR conflicts on the same lines, so it is
 *          closed and the slug is reserved again.
 * Boundary: GitHub only, as stackra-bot (the token is minted like pr-merge.mjs); never touches the working tree or
 *           the current branch. Prints the number and the PR URL.
 * Runtime: node
 * Governing contract: STA-1732; ADR 0293 (agent pushes go through the bot).
 * Secrets: the bot token stays in the gh child's environment.
 */
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import * as botNetwork from "./bot-token.mjs";
import { gh } from "./pr-merge.mjs";

export const NUMBERS_PATH = "apps/docs/src/docs/adr/numbers.yaml";
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISSUE = /^STA-\d+$/;

/** `{ slug, issue, owner }` from the arguments, or null when they are not `<slug> --issue STA-n [--owner <who>]`. */
export function parseReserveArgs(args) {
  const rest = [];
  let issue;
  let owner;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--issue") issue = args[(i += 1)];
    else if (args[i] === "--owner") owner = args[(i += 1)];
    else rest.push(args[i]);
  }
  const [slug] = rest;
  if (rest.length !== 1 || !SLUG.test(slug) || !ISSUE.test(issue ?? "")) return null;
  if (owner !== undefined && !/^[^\n:#]+$/.test(owner)) return null;
  return { slug, issue, owner };
}

/** The next free number of the register: the highest key plus one, four digits. */
export function nextAdrNumber(text) {
  const keys = Object.keys(parse(text, { uniqueKeys: true }) ?? {}).map(Number);
  return String(Math.max(0, ...keys) + 1).padStart(4, "0");
}

/** The register with the reservation appended as its last entry. */
export function withReservation(text, number, { slug, issue, owner }) {
  const lines = [`"${number}":`, `  slug: ${slug}`, "  status: reserved"];
  if (owner) lines.push(`  owner: ${owner}`);
  lines.push(`  issue: ${issue}`);
  return `${text.endsWith("\n") ? text : `${text}\n`}${lines.join("\n")}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const parsed = parseReserveArgs(process.argv.slice(2));
  if (!parsed) {
    process.stderr.write("usage: pnpm adr:reserve <kebab-slug> --issue STA-n [--owner <who>]\n");
    process.exit(2);
  }
  try {
    const token = await botNetwork.mintToken();
    const api = (args, read = false) => JSON.parse(gh(["api", ...args], token, read) || "null");
    const repo = "repos/{owner}/{repo}";
    const file = api([`${repo}/contents/${NUMBERS_PATH}?ref=main`], true);
    const text = Buffer.from(file.content, "base64").toString("utf8");
    const number = nextAdrNumber(text);
    const branch = `adr/${number}-${parsed.slug}`;
    const title = `docs(adr): reserve ${number} ${parsed.slug}`;
    const main = api([`${repo}/git/ref/heads/main`], true).object.sha;
    api(["-X", "POST", `${repo}/git/refs`, "-f", `ref=refs/heads/${branch}`, "-f", `sha=${main}`]);
    api([
      "-X",
      "PUT",
      `${repo}/contents/${NUMBERS_PATH}`,
      "-f",
      `message=${title}\n\nRefs: ${parsed.issue}`,
      "-f",
      `content=${Buffer.from(withReservation(text, number, parsed)).toString("base64")}`,
      "-f",
      `sha=${file.sha}`,
      "-f",
      `branch=${branch}`,
    ]);
    const body =
      `Reserves ADR ${number} for \`${parsed.slug}\` (${parsed.issue}). The first reservation to land wins: if this ` +
      "PR conflicts, close it and run `pnpm adr:reserve` again.\n\nRefs: " +
      parsed.issue;
    const url = gh(
      ["pr", "create", "--head", branch, "--base", "main", "--title", title, "--body", body],
      token,
    ).trim();
    process.stdout.write(`reserved ADR ${number} (${parsed.slug}): ${url}\n`);
  } catch (error) {
    process.stderr.write(`adr:reserve: ${error.message}\n`);
    process.exit(1);
  }
}
