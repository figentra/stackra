/**
 * Stackra file contract:
 * Purpose: unit tests of `useIntentRouter`: free text matching a phrase of the active locale proposes the action with
 *          its permission label, risk and icon; text that matches nothing, or an action the session may not run,
 *          proposes nothing.
 * Boundary: test only; rendered to a string under a container and an `I18nProvider` with English messages.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0155 (intents); ADR 0139 (confirmation).
 */
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import type { Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { I18nConfig, keys, Locale } from "@stackra/i18n";
import { I18nProvider } from "@stackra/i18n/react";
import { describe, expect, it } from "@stackra/testing";
import { renderToString } from "react-dom/server";
import { z } from "zod";

import { ClientSession } from "#contracts/ports/client-session.port";
import { actionRef } from "#core/functions/action-ref.function";
import { intents } from "#core/functions/intents.function";
import type { IntentMatch } from "#react/intent-router/intent-match.type";
import { useIntentRouter } from "#react/intent-router/use-intent-router";

class ArchiveProductAction extends actionRef("catalogue.product.archive@1", {
  input: z.object({ productId: z.string() }),
  output: z.object({}),
  risk: "l2",
}) {}

const I18n = keys({ catalogue: { actions: { product: { archive: ["intents"] } } } });

intents([
  {
    ref: ArchiveProductAction,
    phrases: I18n.catalogue.actions.product.archive.intents,
    icon: "archive",
  },
]);

const MESSAGES = {
  catalogue: {
    permissions: { product: { archive: "Archive products" } },
    actions: {
      product: { archive: { intents: ["archive the summer dress", "stop selling this product"] } },
    },
  },
};

/** A session holding exactly `permissions`. */
class StubSession extends ClientSession {
  private readonly permissions: readonly string[];

  constructor(permissions: readonly string[]) {
    super();
    this.permissions = permissions;
  }

  headers(): Promise<Readonly<Record<string, string>>> {
    return Promise.resolve({});
  }

  can(permission: string): boolean {
    return this.permissions.includes(permission);
  }
}

/** Hands the proposal for `text` to `report`. */
function Probe({
  text,
  report,
}: {
  readonly text: string;
  readonly report: (match: IntentMatch | null) => void;
}) {
  report(useIntentRouter(text));
  return null;
}

/** The proposal for `text` under a session holding `permissions`. */
async function proposalFor(
  text: string,
  permissions: readonly string[],
): Promise<IntentMatch | null> {
  const container = await Container.create(
    [{ member: "console", config: [{ key: "i18n", provide: I18nConfig, override: I18nConfig }] }],
    {
      overrides: new Map<Token, object>([
        [I18nConfig, buildConfig(I18nConfig)],
        [ClientSession, new StubSession(permissions)],
      ]),
    },
  );
  let match: IntentMatch | null | undefined;
  renderToString(
    <ContainerProvider container={container}>
      <I18nProvider locale={Locale.En} messages={MESSAGES}>
        <Probe
          text={text}
          report={(value) => {
            match = value;
          }}
        />
      </I18nProvider>
    </ContainerProvider>,
  );
  if (match === undefined) throw new Error("the probe did not render");
  return match;
}

describe("useIntentRouter", () => {
  it("proposes the action whose phrase the text says", async () => {
    expect(await proposalFor("Archive the summer dress", ["catalogue.product.archive"])).toEqual({
      action: ArchiveProductAction,
      input: {},
      label: "catalogue::permissions.product.archive",
      risk: "l2",
      icon: "archive",
    });
  });

  it("proposes nothing for unrelated text or an action the session may not run", async () => {
    expect(await proposalFor("refund the last order", ["catalogue.product.archive"])).toBeNull();
    expect(await proposalFor("stop selling this product", [])).toBeNull();
  });
});
