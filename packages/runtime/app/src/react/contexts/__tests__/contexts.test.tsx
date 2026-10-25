/**
 * Stackra file contract:
 * Purpose: unit tests of `Contexts`: it mounts the wiring's context keys outermost first with the locale and
 *          catalogues, derives the keys from the module graph when the wiring has no `contexts` section, lets the
 *          `contexts` prop narrow them, mounts the built-in `i18n` context, and fails for a named key with no
 *          registered context and outside a booted container.
 * Boundary: test only; renders with react-dom/server (no DOM needed); registers test-only context keys.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decision 10).
 */
import type { Wiring } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { I18nConfig, Locale } from "@stackra/i18n";
import type { I18nKey } from "@stackra/i18n";
import { useLocale, useTranslation } from "@stackra/i18n/react";
import { describe, expect, it } from "@stackra/testing";
import { renderToString } from "react-dom/server";

import { bootApp } from "#core/functions/boot-app.function";
import type { AppSections } from "#core/types/app-sections.type";
import type { ContextProps } from "#react/contexts/context-props.type";
import { Contexts } from "#react/contexts/contexts";
import { registerContext } from "#react/contexts/register-context";

/** A context that wraps its tree in a marker naming its key and the locale it got. */
const marker =
  (key: string) =>
  ({ locale, children }: ContextProps) => (
    <section data-context={key} lang={locale}>
      {children}
    </section>
  );

registerContext("test_outer", marker("test_outer"));
registerContext("test_inner", marker("test_inner"));

const messages = { web: { nav: { home: "Home" } } };

/** Renders `Contexts` over a container booted from `wiring`. */
async function render(wiring: Wiring & AppSections, contexts?: readonly string[]): Promise<string> {
  const { container } = await bootApp(wiring);
  return renderToString(
    <ContainerProvider container={container}>
      <Contexts
        locale={Locale.En}
        messages={messages}
        {...(contexts === undefined ? {} : { contexts })}
      >
        <span>page</span>
      </Contexts>
    </ContainerProvider>,
  );
}

/** Reads the active locale and one translation from the i18n context. */
function Probe() {
  const { locale } = useLocale();
  const { t } = useTranslation();
  return <span>{`${locale}:${t("web::nav.home" as I18nKey)}`}</span>;
}

describe("Contexts", () => {
  it("mounts the wiring's contexts outermost first", async () => {
    const html = await render({ member: "web", contexts: ["test_outer", "test_inner"] });
    expect(html).toBe(
      '<section data-context="test_outer" lang="en"><section data-context="test_inner" lang="en"><span>page</span></section></section>',
    );
  });

  it("derives the keys from the module graph when the wiring names none", async () => {
    const html = await render({
      member: "mobile",
      modules: {
        storage: { exports: [], dependsOn: [] },
        test_inner: { exports: [], dependsOn: [] },
        test_outer: { exports: [], dependsOn: [] },
      },
    });
    expect(html).toBe(
      '<section data-context="test_inner" lang="en"><section data-context="test_outer" lang="en"><span>page</span></section></section>',
    );
  });

  it("mounts only the keys the contexts prop names", async () => {
    const html = await render({ member: "console", contexts: ["test_outer", "test_inner"] }, [
      "test_inner",
    ]);
    expect(html).toBe('<section data-context="test_inner" lang="en"><span>page</span></section>');
  });

  it("mounts the built-in i18n context with the locale and catalogues", async () => {
    const { container } = await bootApp({
      member: "web",
      contexts: ["i18n"],
      config: [{ key: "i18n", provide: I18nConfig }],
    });
    const html = renderToString(
      <ContainerProvider container={container}>
        <Contexts locale={Locale.En} messages={messages}>
          <Probe />
        </Contexts>
      </ContainerProvider>,
    );
    expect(html).toBe("<span>en:Home</span>");
  });

  it("fails for a named key with no registered context", async () => {
    await expect(render({ member: "web", contexts: ["test_missing"] })).rejects.toThrow(
      /test_missing/,
    );
  });

  it("fails outside a container", () => {
    expect(() =>
      renderToString(
        <Contexts locale={Locale.En} messages={messages}>
          <span>page</span>
        </Contexts>,
      ),
    ).toThrow();
  });
});
