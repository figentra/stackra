/**
 * Stackra file contract:
 * Purpose: the page of the Environment banner route: `@stackra/ui`'s EnvironmentBanner naming a sandbox with what it
 *          means and a publish action, and a toggle that switches the demo to production, where the banner draws
 *          nothing.
 * Boundary: presentation only; the environment is local state. Which environment a tenant is in is the caller's data.
 * Runtime: browser
 * Governing contract: ADR 0060 (light, dark, RTL); STA-803.
 */
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

import { EnvironmentBannerRoute } from "#src/routes/environment-banner/environment-banner.route";

// shortcut: English strings in one place until the playground reads `playground::*` keys (STA-788).
const STRINGS = {
  documentTitle: `${EnvironmentBannerRoute.title} · Stackra Playground`,
  intro:
    "Names the environment the viewer is in, so nobody takes a sandbox for the live shop. In production it draws nothing.",
  demo: "Sandbox",
  environment: "Sandbox",
  description: "Payments are test payments and messages are captured, not sent.",
  publish: "Publish to live",
  production: "Show as production",
} as const;

/** The Environment banner page. */
export function EnvironmentBanner() {
  const [isProduction, setIsProduction] = useState(false);
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{EnvironmentBannerRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="demo-heading" className="grid max-w-xl gap-4">
        <h2 id="demo-heading" className="type-h2">
          {STRINGS.demo}
        </h2>
        <Ui.Switch label={STRINGS.production} value={isProduction} onChange={setIsProduction} />
        <Ui.EnvironmentBanner
          environment={STRINGS.environment}
          isProduction={isProduction}
          description={STRINGS.description}
          actions={<Ui.Button size="sm">{STRINGS.publish}</Ui.Button>}
        />
      </section>
    </article>
  );
}
