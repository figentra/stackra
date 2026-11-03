/**
 * Stackra file contract:
 * Purpose: `serveTestbedCommand(surface, command)`, the job script of `stackra testbed run --serve <surface>`: builds the
 *          product's surfaces, starts the generated Encore app, seeds the `test` profile, serves the built surface with
 *          `stackra preview serve` (the API proxied to the app), waits until both answer, runs `command` with
 *          `STACKRA_E2E_BASE_URL` set, and stops both on exit.
 * Boundary: pure; builds one script string for the box's shell and runs nothing. The surface is checked to be a key.
 * Runtime: node
 * Governing contract: ADR 0484 (the testbed); ADR 0437 (the local edge); ADR 0289 (decision 8, seeded previews); STA-1675.
 */
import { CliUsageError } from "#node/errors/cli-usage.error";

/** A surface key, as `stackra preview serve --surface` takes it. */
const SURFACE = /^[a-z][a-z0-9-]*$/;

/** The ports on the box: the Encore app and the local edge. */
const API_PORT = 4000;
const WEB_PORT = 4173;

// shortcut: waits on any HTTP answer, not a health route; the job's own timeout bounds a hang, add a deadline if it bites.
const wait = (url: string, pid: string): string =>
  `until curl -s -o /dev/null ${url}; do kill -0 $${pid} || exit 1; sleep 1; done`;

/**
 * The script a box runs for a served job.
 *
 * @param surface - the web surface to serve, `console`.
 * @param command - the command that runs against it (the e2e run); it reads `STACKRA_E2E_BASE_URL`.
 * @throws CliUsageError when `surface` is not a surface key.
 * @example
 * serveTestbedCommand("console", "pnpm exec playwright test");
 */
export function serveTestbedCommand(surface: string, command: string): string {
  if (!SURFACE.test(surface)) throw new CliUsageError(`${surface} is not a surface key`);
  const api = `http://127.0.0.1:${API_PORT}`;
  const web = `http://127.0.0.1:${WEB_PORT}`;
  return [
    "set -e",
    "stackra gen",
    "stackra build --product --surfaces-only",
    `(cd .stackra/encore && exec encore run --watch=false --port ${API_PORT}) &`,
    "api=$!",
    "trap 'kill $api $web 2>/dev/null' EXIT",
    wait(api, "api"),
    // `node -p` sees the core modules as globals; a literal require here trips the bundle's no-require guard.
    `stackra seed-pack "$(node -p "JSON.parse(fs.readFileSync('dist/product/build.json', 'utf8')).product")" --profile test --env test`,
    `stackra preview serve --surface ${surface} --port ${WEB_PORT} --api ${api} &`,
    "web=$!",
    wait(web, "web"),
    `export STACKRA_E2E_BASE_URL=${web}`,
    command,
  ].join("\n");
}
