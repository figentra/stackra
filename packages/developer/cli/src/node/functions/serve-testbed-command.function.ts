/**
 * Stackra file contract:
 * Purpose: `serveTestbedCommand(surface, command)`, the job script of `stackra testbed run --serve <surface>`: builds the
 *          product's surfaces, starts the generated Encore app, migrates and seeds the `test` profile into the app's own
 *          database (`encore db conn-uri`, so the seed and the app read one database), serves the built surface with
 *          `stackra preview serve` (the API proxied to the app), waits until both answer, runs `command` with
 *          `STACKRA_E2E_BASE_URL` set, and on exit stops both and removes the Postgres container Encore started.
 * Boundary: pure; builds one script string for the box's shell and runs nothing. The surface is checked to be a key.
 *           The job image puts no `node_modules/.bin` on PATH, so every `stackra` call goes through `pnpm exec`.
 *           `stackra db migrate` and then `stackra seed-pack` run against the app's database through
 *           `DATABASE_DIRECT_URL`.
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
    "pnpm exec stackra gen",
    "pnpm exec stackra build --product --surfaces-only",
    // `node -p` sees the core modules as globals; a literal require here trips the bundle's no-require guard.
    `product=$(node -p "JSON.parse(fs.readFileSync('dist/product/build.json', 'utf8')).product")`,
    // shortcut: `encore run` starts its Postgres (`sqldb-*`) through the host Docker socket, outside the job's network
    // and label, so the agent's cleanup misses it; this removes the ones that appeared while the app started. Another
    // job starting one in that window is removed too. Move the database into the job's compose stack to fix it fully.
    "pg_before=$(docker ps -aq --filter name=sqldb- || true)",
    `(cd .stackra/encore && exec encore run --watch=false --port ${API_PORT}) &`,
    "api=$!",
    `trap 'kill $api $web 2>/dev/null; [ -z "$pg" ] || docker rm -f $pg >/dev/null 2>&1' EXIT`,
    wait(api, "api"),
    `pg=$(docker ps -aq --filter name=sqldb- | grep -vxF "$pg_before" || true)`,
    // shortcut: seeds the database named after the product (the service that owns the seed runner, as in
    // findSeedPack's example); name the database in the request once a product's runner lives in another service.
    // The direct URL wins over DATABASE_URL in the seed runner, so a URL a grant injects never takes the seed elsewhere.
    `DATABASE_DIRECT_URL=$(cd .stackra/encore && encore db conn-uri "$(echo "$product" | tr - _)")`,
    "export DATABASE_DIRECT_URL",
    // The seed ledger is a migration: apply any still pending to that same database before the seed.
    "pnpm exec stackra db migrate --env test",
    `pnpm exec stackra seed-pack "$product" --profile test --env test`,
    `pnpm exec stackra preview serve --surface ${surface} --port ${WEB_PORT} --api ${api} &`,
    "web=$!",
    wait(web, "web"),
    `export STACKRA_E2E_BASE_URL=${web}`,
    command,
  ].join("\n");
}
