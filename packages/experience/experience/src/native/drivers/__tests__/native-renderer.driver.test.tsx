// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `NativeRendererDriver`: a document draws its registered native components with their props
 *          and a working `onEvent`; an empty document draws nothing; props the block's schema refuses throw before
 *          anything is drawn.
 * Boundary: test only, jsdom. React Native does not load in vitest, so the test component draws DOM elements; the
 *           block and its schema are registered by hand, as gen will; `@stackra/ui/native` and
 *           `@stackra/clients/react` are stand-ins.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0110 (decisions 3, 4 and 6); ADR 0112 (X5, X9).
 */
import { isRefusal } from "@stackra/errors";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { z } from "zod";

import { Renderer } from "#contracts/ports/renderer.port";
import type { BlockEvent } from "#contracts/types/block-event.type";
import { Block } from "#core/bases/block.base";
import { BLOCK_ENTRIES } from "#core/constants/block-entries.constant";
import { BlockCategory } from "#core/enums/block-category.enum";
import { InvalidDocumentError } from "#core/errors/invalid-document.error";
import { registerBlocks } from "#core/functions/register-blocks.function";
import { NativeRendererDriver } from "#native/drivers/native-renderer.driver";

vi.mock("@stackra/clients/react", () => ({ useQuery: () => ({ data: undefined, error: null }) }));
vi.mock("@stackra/ui/native", () => ({ Skeleton: () => null }));

class PromoBannerBlock extends Block({ category: BlockCategory.Marketing, icon: "megaphone" }) {
  headline!: string;
}

registerSchemas([[PromoBannerBlock, z.object({ headline: z.string().min(1).max(60) })]]);

/** The banner's native component, drawn as DOM here. */
const PromoBanner = (props: {
  readonly headline: string;
  readonly onEvent: (event: BlockEvent) => void;
}) => (
  <button type="button" onClick={() => props.onEvent({ verb: "navigate", route: "create_order" })}>
    {props.headline}
  </button>
);

afterEach(() => {
  cleanup();
  BLOCK_ENTRIES.clear();
});

describe("NativeRendererDriver", () => {
  it("draws the registered native component and routes its verb to the screen", () => {
    registerBlocks([
      { key: "mobile.promo_banner", block: PromoBannerBlock, component: PromoBanner },
    ]);
    const onNavigate = vi.fn();
    const driver = new NativeRendererDriver();
    render(
      <>
        {
          driver.render(
            { block: "mobile.promo_banner", props: { headline: "Ramadan offers" } },
            { locale: "ar", onNavigate },
          ) as ReactNode
        }
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ramadan offers" }));
    expect(onNavigate).toHaveBeenCalledWith("create_order");
    expect(driver).toBeInstanceOf(Renderer);
  });

  it("draws nothing for an empty document", () => {
    expect(new NativeRendererDriver().render(undefined, { locale: "en" })).toBeNull();
  });

  it("throws on props the block refuses, before drawing", () => {
    registerBlocks([
      { key: "mobile.promo_banner", block: PromoBannerBlock, component: PromoBanner },
    ]);
    let refused: unknown;
    try {
      new NativeRendererDriver().render(
        { block: "mobile.promo_banner", props: { headline: "" } },
        { locale: "en" },
      );
    } catch (error) {
      refused = error;
    }
    expect(isRefusal(refused, InvalidDocumentError)).toBe(true);
  });
});
