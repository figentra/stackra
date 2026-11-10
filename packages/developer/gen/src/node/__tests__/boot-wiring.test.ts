/**
 * Stackra file contract:
 * Purpose: guard that a service's generated wiring binds what its generated boot resolves: for every golden service,
 *          each `BOOT_SERVICES` class its `boot.ts` gets from the container has a `provide:` row in its `wiring.ts`,
 *          or the service stops at boot with "Nothing binds …" (STA-2664 (n)).
 * Boundary: test only; reads the committed golden trees under `__golden__/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2664 (n).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { BOOT_SERVICES } from "#core/constants/boot-services.constant";

const GOLDEN = fileURLToPath(new URL("../../../__golden__/", import.meta.url));

/** Each golden service's generated folder that holds a boot: `<fixture>/expected/services/<name>/.stackra/gen`. */
const genFolders = (): string[] =>
  readdirSync(GOLDEN).flatMap((fixture) => {
    const services = join(GOLDEN, fixture, "expected", "services");
    if (!existsSync(services)) return [];
    return readdirSync(services)
      .map((service) => join(services, service, ".stackra", "gen"))
      .filter((folder) => existsSync(join(folder, "boot.ts.golden")));
  });

describe("a service's generated boot and wiring", () => {
  const folders = genFolders();

  it("finds golden services with a boot", () => {
    expect(folders.length).toBeGreaterThan(0);
  });

  it("binds every BOOT_SERVICES class the boot resolves", () => {
    const names = BOOT_SERVICES.flatMap(({ services }) => services.map((service) => service.name));
    const missing = folders.flatMap((folder) => {
      const boot = readFileSync(join(folder, "boot.ts.golden"), "utf8");
      const wiring = readFileSync(join(folder, "wiring.ts.golden"), "utf8");
      return names
        .filter((name) => boot.includes(`container.get(${name})`))
        .filter((name) => !new RegExp(`provide: \\w*${name}\\b`).test(wiring))
        .map((name) => `${folder.slice(GOLDEN.length)}: ${name}`);
    });
    expect(missing).toEqual([]);
  });
});
