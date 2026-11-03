/**
 * Stackra file contract:
 * Purpose: `checkWorkflowTriggers(workflows)`, the `workflow-triggers` rule (STA-256, ADR 0166, 0167). A workflow on a
 *          `push` to a branch, `pull_request` or `pull_request_target` runs no paid job: a macOS, Windows or larger
 *          runner, an EAS build or a device farm run, in its own jobs or in a local workflow a job calls. Paid work sits
 *          behind `workflow_dispatch`, a tag, a schedule or a release. A test job (one with no `environment:`) never
 *          carries a deploy identity in its env, from the workflow, the job or a step.
 * Boundary: pure over `[path, text]` pairs of `.github/workflows/*.yml`; a file that does not parse is skipped. A job
 *           named in `WORKFLOW_TRIGGER_ALLOWED` (with its reason) is not checked.
 * Runtime: node
 * Governing contract: ADR 0166, ADR 0167; STA-256.
 */
import { parse } from "yaml";

import { WORKFLOW_TRIGGER_ALLOWED } from "#node/constants/workflow-trigger-allowed.constant";

type Node = { readonly [key: string]: unknown };

/** A runner label GitHub bills above the free standard Linux one. */
const PAID_RUNNER = /\b(?:macos|windows)-|-(?:large|xlarge|\d+-?cores?)\b|\bgpu\b/i;

/** A step command that spends per run: an EAS cloud build or workflow, a device farm. */
const PAID_COMMAND =
  /\beas\s+(?:build|workflow:run)\b|\baws\s+devicefarm\b|\bgcloud\s+firebase\s+test\b/;

/** An env key that is a deploy or cloud credential. */
const DEPLOY_KEY =
  /^(?:CLOUDFLARE_API_TOKEN|EXPO_TOKEN|ENCORE_\w+|AWS_(?:ACCESS_KEY_ID|SECRET_ACCESS_KEY|SESSION_TOKEN)|VERCEL_TOKEN|FLY_API_TOKEN|NETLIFY_AUTH_TOKEN|PULUMI_ACCESS_TOKEN|MINTLIFY_ADMIN_KEY)$/;

/** An env value read from a variable or secret named as a deploy one. */
const DEPLOY_VALUE = /\b(?:vars|secrets)\.\w*DEPLOY\w*/i;

const LOCAL_CALL = /^\.\/(\.github\/workflows\/[^@]+)$/;

const isNode = (value: unknown): value is Node => typeof value === "object" && value !== null;

const nodes = (value: unknown): Node[] => (Array.isArray(value) ? value.filter(isNode) : []);

/** Whether `on` holds a branch push or a pull request; a push filtered to tags alone is a release. */
function onPushOrPull(on: unknown): boolean {
  if (typeof on === "string") return ["push", "pull_request", "pull_request_target"].includes(on);
  if (Array.isArray(on)) return on.some((event) => onPushOrPull(event));
  if (!isNode(on)) return false;
  if ("pull_request" in on || "pull_request_target" in on) return true;
  if (!("push" in on)) return false;
  const push = on["push"];
  return (
    !isNode(push) ||
    !(
      ("tags" in push || "tags-ignore" in push) &&
      !("branches" in push || "branches-ignore" in push)
    )
  );
}

/** Why `job` costs money per run, or undefined when it does not. */
function paidReason(job: Node): string | undefined {
  const runner = JSON.stringify(job["runs-on"] ?? "");
  if (PAID_RUNNER.test(runner)) return `runs on a paid runner (${runner})`;
  const step = nodes(job["steps"]).find((s) => PAID_COMMAND.test(String(s["run"] ?? "")));
  return step ? `runs a paid command (${PAID_COMMAND.exec(String(step["run"]))?.[0]})` : undefined;
}

/**
 * The findings of paid jobs on push or pull request triggers and of deploy identities in test jobs.
 *
 * @param workflows - each workflow's repository path and text.
 * @param allowed - the jobs not checked, `WORKFLOW_TRIGGER_ALLOWED` by default.
 * @example
 * checkWorkflowTriggers([[".github/workflows/ci.yml", "on: push\njobs:\n  a:\n    runs-on: macos-latest\n"]]);
 */
export function checkWorkflowTriggers(
  workflows: readonly (readonly [path: string, text: string])[],
  allowed: readonly { readonly path: string; readonly job: string }[] = WORKFLOW_TRIGGER_ALLOWED,
): string[] {
  const docs = new Map<string, Node>();
  for (const [path, text] of workflows) {
    try {
      const doc: unknown = parse(text);
      if (isNode(doc)) docs.set(path, doc);
    } catch {
      // an invalid file is the YAML check's finding
    }
  }
  const jobsOf = (doc: Node | undefined): [string, Node][] => {
    const jobs = doc?.["jobs"];
    return isNode(jobs)
      ? Object.entries(jobs).filter((entry): entry is [string, Node] => isNode(entry[1]))
      : [];
  };
  const out: string[] = [];
  for (const [path, doc] of docs) {
    // YAML 1.1 readers turn a bare `on` key into `true`; `yaml` keeps the string, but read both.
    const triggered = onPushOrPull(doc["on"] ?? doc["true"]);
    for (const [name, job] of jobsOf(doc)) {
      if (allowed.some((entry) => entry.path === path && entry.job === name)) continue;
      if (triggered) {
        const reason = paidReason(job);
        if (reason)
          out.push(
            `${path}: job \`${name}\` ${reason} on a push or pull request trigger; move it behind workflow_dispatch, a tag or a schedule (ADR 0166)`,
          );
        const called = LOCAL_CALL.exec(String(job["uses"] ?? ""))?.[1];
        for (const [inner, body] of jobsOf(called ? docs.get(called) : undefined)) {
          const why = paidReason(body);
          if (why)
            out.push(
              `${path}: job \`${name}\` calls ${called}, whose job \`${inner}\` ${why}, on a push or pull request trigger; move it behind workflow_dispatch, a tag or a schedule (ADR 0166)`,
            );
        }
      }
      if (job["environment"] !== undefined || job["uses"] !== undefined) continue;
      const envs = [doc["env"], job["env"], ...nodes(job["steps"]).map((s) => s["env"])].filter(
        isNode,
      );
      for (const [key, value] of envs.flatMap((env) => Object.entries(env))) {
        const text = String(value ?? "");
        if ((DEPLOY_KEY.test(key) && text !== "") || DEPLOY_VALUE.test(text)) {
          out.push(
            `${path}: job \`${name}\` has no environment but its env sets the deploy identity \`${key}\`; give it only to the deploy job (ADR 0167)`,
          );
        }
      }
    }
  }
  return out;
}
