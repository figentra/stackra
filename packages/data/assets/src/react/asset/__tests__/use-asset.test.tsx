/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useAsset(entry)`: it renders the URL of a public asset through the `AssetLibrary`
 *          the nearest container binds, keeps the key's literal type, and throws outside a provider, when nothing binds
 *          the library, and for a non-public asset.
 * Boundary: test only; renders with react-dom/server (no DOM needed); a memory disk stands in for the CDN bucket.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0234 (decision 3); ADR 0295 (decision 10).
 */
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { Clock } from "@stackra/contracts";
import { FilesystemConfig, MemoryFileSystemDriver } from "@stackra/filesystem";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { renderToString } from "react-dom/server";

import { AssetLibrary, assets } from "#core/index";
import type { AssetEntry, ResolvedAsset } from "#core/index";
import { useAsset } from "#react/asset/use-asset";

/** Always 2026-10-24T09:00Z. */
class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-24T09:00:00.000Z");
  }
}

const Assets = assets({
  console: {
    ai: {
      shell_md: { key: "console::ai/shell.md", file: "assets/ai/shell.md", overridable: false },
    },
    public: {
      logo_svg: {
        key: "console::public/logo.svg",
        file: "assets/public/logo.svg",
        overridable: true,
      },
    },
  },
});

/** Renders the image of `entry`. */
function Logo({ entry }: { entry: AssetEntry }) {
  return <img src={useAsset(entry).url} alt="" />;
}

/** Renders `<Logo />` in a container that binds an `AssetLibrary` over a memory disk serving from the CDN. */
async function renderWith(entry: AssetEntry): Promise<string> {
  const files = new MemoryFileSystemDriver(
    buildConfig(FilesystemConfig, { values: { url: "https://cdn.test" } }),
    new FixedClock(),
  );
  const container = await Container.create([], {
    overrides: new Map([[AssetLibrary, new AssetLibrary(files)]]),
  });
  return renderToString(
    <ContainerProvider container={container}>
      <Logo entry={entry} />
    </ContainerProvider>,
  );
}

describe("useAsset", () => {
  it("renders the URL the container's AssetLibrary resolves", async () => {
    expect(await renderWith(Assets.console.public.logo_svg)).toBe(
      // React 19 hoists a preload hint for each image it renders on the server.
      '<link rel="preload" as="image" href="https://cdn.test/console/public/logo.svg"/>' +
        '<img src="https://cdn.test/console/public/logo.svg" alt=""/>',
    );
  });

  it("keeps the key's literal type", () => {
    expectTypeOf(useAsset<"console::public/logo.svg">).returns.toEqualTypeOf<
      ResolvedAsset<"console::public/logo.svg">
    >();
  });

  it("throws for an asset outside public/", async () => {
    await expect(renderWith(Assets.console.ai.shell_md)).rejects.toThrow(/not public/);
  });

  it("throws outside a ContainerProvider", () => {
    expect(() => renderToString(<Logo entry={Assets.console.public.logo_svg} />)).toThrow(
      /ContainerProvider/,
    );
  });

  it("throws when the container does not bind AssetLibrary", async () => {
    const container = await Container.create([]);
    expect(() =>
      renderToString(
        <ContainerProvider container={container}>
          <Logo entry={Assets.console.public.logo_svg} />
        </ContainerProvider>,
      ),
    ).toThrow(/AssetLibrary/);
  });
});
