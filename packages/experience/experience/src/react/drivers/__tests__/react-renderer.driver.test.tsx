/**
 * Stackra file contract:
 * Purpose: unit tests of `ReactRendererDriver`: a published document draws its registered web components in order,
 *          with every `LocalizedText` in the context's locale; an empty document draws nothing; an unknown key throws
 *          before anything is drawn.
 * Boundary: test only, jsdom. The blocks and their schemas are registered by hand, as gen will; `@stackra/ui/react` and
 *           `@stackra/clients/react` are stand-ins (no block here accepts a query).
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0110 (decisions 4 and 6); ADR 0112 (X5, X9).
 */
// @vitest-environment jsdom
import { Port } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { z } from "zod";

import { Renderer } from "#contracts/ports/renderer.port";
import { Block } from "#core/bases/block.base";
import { BLOCK_ENTRIES } from "#core/constants/block-entries.constant";
import { BlockCategory } from "#core/enums/block-category.enum";
import { UnknownBlockError } from "#core/errors/unknown-block.error";
import { registerBlocks } from "#core/functions/register-blocks.function";
import type { LocalizedText } from "#core/types/localized-text.type";
import { ReactRendererDriver } from "#react/drivers/react-renderer.driver";

vi.mock("@stackra/clients/react", () => ({ useQuery: () => ({ data: undefined, error: null }) }));
vi.mock("@stackra/ui/react", () => ({ Skeleton: () => null }));

class HeroSectionBlock extends Block({
  category: BlockCategory.Marketing,
  icon: "sparkles",
}) {
  title!: LocalizedText;
}

registerSchemas([[HeroSectionBlock, z.object({ title: z.record(z.string(), z.string()) })]]);

/** The hero's web component. */
const HeroSection = ({ title }: { readonly title: string }) => <h1>{title}</h1>;

afterEach(() => {
  cleanup();
  BLOCK_ENTRIES.clear();
});

describe("ReactRendererDriver", () => {
  it("draws each node's registered component in the context's locale", () => {
    registerBlocks([{ key: "web.hero_section", block: HeroSectionBlock, component: HeroSection }]);
    const driver = new ReactRendererDriver();
    render(
      <>
        {
          driver.render(
            [
              {
                block: "web.hero_section",
                props: { title: { en: "Sell online", ar: "بع عبر الإنترنت" } },
              },
              { block: "web.hero_section", props: { title: { en: "Pricing" } } },
            ],
            { locale: "ar" },
          ) as ReactNode
        }
      </>,
    );
    expect(screen.getAllByRole("heading").map((heading) => heading.textContent)).toEqual([
      "بع عبر الإنترنت",
      "Pricing",
    ]);
    expect(driver).toBeInstanceOf(Renderer);
    expect(driver).toBeInstanceOf(Port);
  });

  it("draws nothing for an empty document", () => {
    expect(new ReactRendererDriver().render(null, { locale: "en" })).toBeNull();
  });

  it("throws on a key nobody registered, before drawing", () => {
    let refused: unknown;
    try {
      new ReactRendererDriver().render({ block: "web.gone" }, { locale: "en" });
    } catch (error) {
      refused = error;
    }
    expect(isRefusal(refused, UnknownBlockError)).toBe(true);
  });
});
