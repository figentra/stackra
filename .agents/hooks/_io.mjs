/**
 * Stackra file contract:
 * Purpose: Shared stdin/stdout protocol helpers for Stackra's agent hooks. Node 24, no dependencies — a hook may run
 *          before `pnpm install`.
 * Boundary: stdin and stdout of one hook process only.
 * Runtime: node (agent hook)
 * Governing contract: ADR 0016 (agents source of truth); ADR 0293.
 */

/** Read and JSON-parse the hook payload the harness writes to stdin. Never throws. */
export async function readStdin() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

/** Flatten every string found anywhere in a (possibly nested) tool_input value. */
export function collectStrings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === "object")
    Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
}

/** Block the tool call that is about to run, with a reason shown to the agent. */
export function deny(event, reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: event,
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

/** Hand the tool call to the human for confirmation, with a reason shown to them. */
export function ask(event, reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: event,
        permissionDecision: "ask",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

/** Hand the agent additional context without blocking anything. */
export function context(event, text) {
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: text } }),
  );
  process.exit(0);
}

/**
 * Run a hook's body with a fail-open guarantee: any thrown error (a bad regex, an
 * unexpected stdin shape, a filesystem race) is swallowed and the hook exits 0 with
 * no output, which the harness reads as "allow, nothing to add". A broken hook must
 * never become a blocked repository.
 */
export async function failOpen(fn) {
  try {
    await fn();
  } catch {
    // Intentionally silent: this branch exists so a hook bug never blocks work.
  }
  process.exit(0);
}
