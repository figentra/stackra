/**
 * Stackra file contract:
 * Purpose: `planDevSurface(root, surface, entry, options)`, what `stackra dev --surface` starts: the `DevSurface`
 *          descriptor (shell URL, packages, API) and the processes. With `--os <path>` the shell is the local
 *          checkout's dev server (Vite in `<path>/apps/<shell>` on that app's `environments.dev.port`), which serves
 *          the product packages' surface entries from source and a landing's seed document, as the descriptor names
 *          them (`STACKRA_DEV_SURFACE`); otherwise it is the published version at `<shell origin>/<owner>/<name>@<version>/`
 *          (`--shell` picks a version inside the surface's line, default the line). Vite always serves the product
 *          bundle with the surface's bundle-mode config. The API is `--api`, else the root runway's local gateway.
 * Boundary: starts nothing and writes nothing; reads only the shell app's `runway.yaml` in a local checkout. Every
 *           value comes from the runway files or a flag (configuration, not code): no origin, port or URL is built in.
 * Runtime: node
 * Governing contract: ADR 0436 (decisions 5 and 6: one version line; local development runs the real shell);
 *                     app-shells section 15 point 2; ADR 0170 (`local` is `dev`).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { parse } from "yaml";

import { DEV_SURFACE_FILES } from "#node/dev-surface/constants/dev-surface-files.constant";
import { surfaceEntries } from "#node/dev-surface/functions/surface-entries.function";
import type { DevSurface } from "#node/dev-surface/types/dev-surface.type";
import type { DevSurfaceOptions } from "#node/dev-surface/types/dev-surface-options.type";
import type { RootSurface } from "#node/dev-surface/types/root-surface.type";
import { CliUsageError } from "#node/errors/cli-usage.error";
import type { ToolRun } from "#node/types/tool-run.type";

/** The seed page of a landing's `content` folder: `index.json`, else `home.json`, else the first JSON file. */
function seedDocument(root: string, content: string | undefined): string | undefined {
  if (content === undefined) return undefined;
  const folder = resolve(root, content);
  if (!existsSync(folder)) return undefined;
  const files = readdirSync(folder).filter((file) => file.endsWith(".json"));
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here; toSorted is ES2023
  const first = ["index.json", "home.json"].find((file) => files.includes(file)) ?? files.sort()[0];
  return first === undefined ? undefined : join(folder, first);
}

/** `url` as an absolute http(s) URL ending in `/`, or a usage error naming `flag`. */
function baseUrl(url: string, flag: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new CliUsageError(`${flag} is not a URL: ${url}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new CliUsageError(`${flag} must be http or https: ${url}`);
  }
  return parsed.href.endsWith("/") ? parsed.href : `${parsed.href}/`;
}

/**
 * The descriptor and processes of one surface run.
 *
 * @param root - the product repository root.
 * @param surface - the surface key.
 * @param entry - the surface as `readSurface` read it.
 * @param options - the flags.
 * @throws CliUsageError when the flags conflict, a URL is bad, or the shell or API cannot be located.
 * @example
 * planDevSurface("/repo", "console", entry, { shellOrigin: "https://shells.example.test" });
 * // descriptor.shell.url === "https://shells.example.test/os/console@3/"
 */
export function planDevSurface(
  root: string,
  surface: string,
  entry: RootSurface,
  options: DevSurfaceOptions,
): { readonly descriptor: DevSurface; readonly runs: readonly ToolRun[] } {
  const { owner, name, line } = entry.shell;
  const ref = `${owner}/${name}@${line}`;

  const api =
    options.api !== undefined
      ? baseUrl(options.api, "--api")
      : entry.gatewayPort !== undefined
        ? `http://localhost:${entry.gatewayPort}/`
        : undefined;
  if (api === undefined) {
    throw new CliUsageError(
      "no local API: pass --api <url> or set environments.dev.infra.gateway.port in runway.yaml",
    );
  }

  const vite: ToolRun = {
    command: "vite",
    args: ["--config", DEV_SURFACE_FILES.viteConfig(surface)],
    cwd: root,
  };

  if (options.os !== undefined) {
    if (options.shell !== undefined) {
      throw new CliUsageError("--shell picks a published version; --os runs a local checkout");
    }
    const app = resolve(root, options.os, "apps", name);
    if (!existsSync(app)) {
      throw new CliUsageError(`no ${name} shell in the checkout: ${app} does not exist`);
    }
    const runway = join(app, "runway.yaml");
    const { environments } = existsSync(runway)
      ? ((parse(readFileSync(runway, "utf8")) ?? {}) as {
          environments?: { dev?: { port?: unknown } };
        })
      : {};
    const port = environments?.dev?.port;
    if (typeof port !== "number") {
      throw new CliUsageError(`the ${name} shell declares no environments.dev.port in ${runway}`);
    }
    const document = seedDocument(root, entry.content);
    return {
      descriptor: {
        surface,
        shell: { ref, url: `http://localhost:${port}/`, local: true },
        packages: entry.packages,
        api,
        ...(entry.product === undefined ? {} : { product: entry.product }),
        root,
        entries: surfaceEntries(root, entry.packages, surface),
        ...(document === undefined ? {} : { document }),
      },
      // The shell's own dev server serves the packages from source (figentra/os `shellDev`); no product Vite runs.
      runs: [
        {
          command: "vite",
          args: ["--port", String(port), "--strictPort"],
          cwd: app,
          env: { STACKRA_DEV_SURFACE: join(root, DEV_SURFACE_FILES.descriptor(surface)) },
        },
      ],
    };
  }

  if (options.shellOrigin === undefined) {
    throw new CliUsageError(
      "no shell: pass --os <checkout> or --shell-origin <url> (or set STACKRA_SHELL_ORIGIN)",
    );
  }
  const version = options.shell ?? String(line);
  if (!/^\d+(\.\d+){0,2}(-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new CliUsageError(`bad shell version: ${version}`);
  }
  if (version.split(/[.-]/)[0] !== String(line)) {
    throw new CliUsageError(`--shell ${version} is outside the surface's line ${ref}`);
  }
  const url = new URL(
    `${owner}/${name}@${version}/`,
    baseUrl(options.shellOrigin, "--shell-origin"),
  ).href;
  return {
    descriptor: { surface, shell: { ref, url, local: false }, packages: entry.packages, api },
    runs: [vite],
  };
}
